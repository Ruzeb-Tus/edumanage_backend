# -*- coding: utf-8 -*-
import re
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

def _get_months_for_year(academic_year):
    years = re.findall(r'\d+', academic_year or '')
    if len(years) >= 2:
        y1 = int(years[0])
        y2_str = years[1]
        if len(y2_str) == 2:
            y2 = int(str(y1)[:2] + y2_str)
        else:
            y2 = int(y2_str)
    elif len(years) == 1:
        y1 = int(years[0])
        y2 = y1 + 1
    else:
        y1 = 2026
        y2 = 2027
        
    months_def = [
        (6, y1, "June"),
        (7, y1, "July"),
        (8, y1, "August"),
        (9, y1, "September"),
        (10, y1, "October"),
        (11, y1, "November"),
        (12, y1, "December"),
        (1, y2, "January"),
        (2, y2, "February"),
        (3, y2, "March"),
        (4, y2, "April"),
        (5, y2, "May"),
    ]
    return months_def

class EduManageFeeStructure(models.Model):
    _name = 'edumanage.fee.structure'
    _description = 'Fee Structure'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(string='Reference', required=True, copy=False, readonly=True, default=lambda self: _('New'))
    class_id = fields.Many2one('edumanage.class', string='Class', required=True, tracking=True)
    amount = fields.Float(string='Fee Amount', required=True, tracking=True)
    academic_year = fields.Char(string='Academic Year', required=True, tracking=True)
    status = fields.Selection([
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('inactive', 'Inactive')
    ], string='Status', default='draft', tracking=True)

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('name', _('New')) == _('New'):
                vals['name'] = self.env['ir.sequence'].next_by_code('edumanage.fee.structure') or 'FEE-NEW'
        return super().create(vals_list)

    @api.constrains('class_id', 'academic_year')
    def _check_unique_active_fee(self):
        for record in self:
            existing = self.search([
                ('id', '!=', record.id),
                ('class_id', '=', record.class_id.id),
                ('academic_year', '=', record.academic_year),
            ])
            if existing:
                raise ValidationError(_("A fee structure has already been assigned for this class and academic year. Please delete or revoke the existing one before setting a new one."))

    def action_revoke(self):
        for record in self:
            # Revoke all assigned fees for this structure
            self.env['edumanage.student.fee'].search([('fee_structure_id', '=', record.id)]).unlink()
            record.unlink()
        return True

    def action_confirm(self):
        for record in self:
            if record.amount <= 0:
                raise ValidationError(_("Fee Amount must be strictly positive."))
                
            students = self.env['edumanage.student'].search([
                ('class_id', '=', record.class_id.id),
                ('status', '=', 'active')
            ])
            
            student_fee_env = self.env['edumanage.student.fee']
            months_def = _get_months_for_year(record.academic_year)
            
            for student in students:
                for m_num, m_year, m_name in months_def:
                    fee_month = f"{m_name} {m_year}"
                    due_date = f"{m_year:04d}-{m_num:02d}-01"
                    
                    existing_fee = student_fee_env.search([
                        ('student_id', '=', student.id),
                        ('fee_structure_id', '=', record.id),
                        ('fee_month', '=', fee_month)
                    ], limit=1)
                    
                    if not existing_fee:
                        student_fee_env.create({
                            'student_id': student.id,
                            'fee_structure_id': record.id,
                            'total_amount': record.amount,
                            'academic_year': record.academic_year,
                            'fee_month': fee_month,
                            'due_date': due_date,
                            'status': 'pending',
                        })
                        if student.fee_status == 'paid':
                            student.fee_status = 'due'
            
            record.status = 'active'
        return True


class EduManageStudentFee(models.Model):
    _name = 'edumanage.student.fee'
    _description = 'Student Fee Assignment'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    
    name = fields.Char(compute='_compute_name', store=True)
    student_id = fields.Many2one('edumanage.student', string='Student', required=True, ondelete='cascade', tracking=True)
    fee_structure_id = fields.Many2one('edumanage.fee.structure', string='Fee Structure', required=True, ondelete='cascade', tracking=True)
    class_id = fields.Many2one('edumanage.class', related='student_id.class_id', store=True)
    section_id = fields.Many2one('edumanage.section', related='student_id.section_id', store=True)
    academic_year = fields.Char(string='Academic Year', tracking=True)
    fee_month = fields.Char(string='Fee Month', tracking=True)
    total_amount = fields.Float(string='Total Fee Amount', required=True, tracking=True)
    amount_paid = fields.Float(string='Amount Paid', default=0.0, tracking=True)
    remaining_due = fields.Float(string='Remaining Due', compute='_compute_remaining_due', store=True)
    due_date = fields.Date(string='Due Date', tracking=True)
    
    status = fields.Selection([
        ('pending', 'Pending'),
        ('partial', 'Partial'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue')
    ], string='Status', default='pending', compute='_compute_status', store=True)
    
    payment_ids = fields.One2many('edumanage.fee.payment', 'student_fee_id', string='Payments')

    @api.depends('student_id', 'fee_month')
    def _compute_name(self):
        for record in self:
            if record.student_id and record.fee_month:
                record.name = f"{record.student_id.name} - {record.fee_month}"
            else:
                record.name = "New Fee Assignment"

    @api.depends('total_amount', 'amount_paid')
    def _compute_remaining_due(self):
        for record in self:
            record.remaining_due = record.total_amount - record.amount_paid

    @api.depends('total_amount', 'amount_paid', 'due_date')
    def _compute_status(self):
        today = fields.Date.today()
        for record in self:
            if record.amount_paid >= record.total_amount:
                record.status = 'paid'
            elif record.amount_paid > 0:
                record.status = 'partial'
            elif record.due_date and record.due_date < today:
                record.status = 'overdue'
            else:
                record.status = 'pending'

    def action_collect_payment(self):
        self.ensure_one()
        return {
            'name': _('Collect Payment'),
            'type': 'ir.actions.act_window',
            'res_model': 'edumanage.fee.payment',
            'view_mode': 'form',
            'target': 'new',
            'context': {
                'default_student_fee_id': self.id,
                'default_amount_collected': self.remaining_due,
            }
        }


class EduManageFeePayment(models.Model):
    _name = 'edumanage.fee.payment'
    _description = 'Student Fee Payment'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(string='Receipt Number', required=True, copy=False, readonly=True, default=lambda self: _('New'))
    student_id = fields.Many2one('edumanage.student', string='Student', required=True, ondelete='cascade', tracking=True)
    student_fee_id = fields.Many2one('edumanage.student.fee', string='Student Fee Record', required=True, ondelete='cascade', tracking=True)
    class_id = fields.Many2one('edumanage.class', string='Class', tracking=True)
    section_id = fields.Many2one('edumanage.section', string='Section', tracking=True)
    academic_year = fields.Char(string='Academic Year', tracking=True)
    fee_month = fields.Char(string='Fee Month', tracking=True)
    collection_date = fields.Date(string='Collection Date', default=fields.Date.today, tracking=True)
    amount_collected = fields.Float(string='Amount Collected', required=True, tracking=True)
    payment_method = fields.Selection([
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('upi', 'UPI'),
        ('bank_transfer', 'Bank Transfer')
    ], string='Payment Method', default='upi', required=True, tracking=True)
    remarks = fields.Text(string='Remarks', tracking=True)
    collected_by = fields.Char(string='Collected By', default=lambda self: self.env.user.name, tracking=True)

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('name', _('New')) == _('New'):
                vals['name'] = self.env['ir.sequence'].next_by_code('edumanage.fee.payment') or 'REC-NEW'
            
            if vals.get('student_fee_id'):
                fee = self.env['edumanage.student.fee'].browse(vals['student_fee_id'])
                vals['student_id'] = fee.student_id.id
                vals['class_id'] = fee.student_id.class_id.id
                vals['section_id'] = fee.student_id.section_id.id
                vals['academic_year'] = fee.academic_year
                vals['fee_month'] = fee.fee_month
                
                # Verify that remaining due is not exceeded
                remaining = fee.total_amount - fee.amount_paid
                if vals.get('amount_collected', 0.0) > remaining:
                    raise ValidationError(_("Collected amount (₹%s) exceeds the remaining due (₹%s).") % (vals.get('amount_collected'), remaining))
                
                # Update paid amount on student fee
                fee.amount_paid += vals.get('amount_collected', 0.0)
                
                # Update student's global fee status
                all_fees = self.env['edumanage.student.fee'].search([('student_id', '=', fee.student_id.id)])
                # If any fee is overdue or due, global fee status is due/overdue
                any_overdue = any(f.status == 'overdue' for f in all_fees)
                any_due = any(f.status in ['pending', 'partial'] for f in all_fees)
                if any_overdue:
                    fee.student_id.fee_status = 'overdue'
                elif any_due:
                    fee.student_id.fee_status = 'due'
                else:
                    fee.student_id.fee_status = 'paid'
                
        return super().create(vals_list)

    def action_print_receipt(self):
        self.ensure_one()
        return self.env.ref('edumanage_dashboard.action_report_fee_receipt').report_action(self)

