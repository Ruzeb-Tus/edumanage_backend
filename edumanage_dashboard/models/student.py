# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
from odoo.exceptions import ValidationError

class EduManageClass(models.Model):
    _name = 'edumanage.class'
    _description = 'EduManage Class'
    _order = 'name'

    name = fields.Char(string='Class Name', required=True)
    code = fields.Char(string='Class Code')
    academic_year = fields.Char(string='Academic Year', default='2026-27')
    class_teacher = fields.Char(string='Class Teacher')
    status = fields.Selection([
        ('active', 'Active'),
        ('archived', 'Archived')
    ], string='Status', default='active', required=True)
    active = fields.Boolean(string='Active', default=True)
    section_ids = fields.One2many('edumanage.section', 'class_id', string='Sections')

    @api.model
    def get_classes_data(self):
        classes = self.search([])
        res = []
        for c in classes:
            students = self.env['edumanage.student'].search([('class_id', '=', c.id)])
            total_students = len(students)
            active_students = len(students.filtered(lambda s: s.status == 'active'))
            
            sections = []
            for s in c.section_ids:
                sections.append({
                    'id': s.id,
                    'name': s.name,
                    'status': s.status or 'active',
                    'active': s.active,
                })
            
            teacher = c.class_teacher or "Not Assigned"
            code = c.code or f"CLS-{c.id:02d}"
            acad_year = c.academic_year or "2026-27"
            
            res.append({
                'id': c.id,
                'name': c.name,
                'code': code,
                'academic_year': acad_year,
                'class_teacher': teacher,
                'status': c.status or 'active',
                'active': c.active,
                'sections': sections,
                'total_students': total_students,
                'active_students': active_students,
                'total_sections': len(sections),
                'students': total_students,
                'attendance': 95,
                'subjects': len(sections) * 2,
                'section': ", ".join([s['name'] for s in sections if s['status'] == 'active']),
                'teacher': teacher,
            })
        return res

class EduManageSection(models.Model):
    _name = 'edumanage.section'
    _description = 'EduManage Section'
    _order = 'name'

    name = fields.Char(string='Section Name', required=True)
    class_id = fields.Many2one('edumanage.class', string='Class', required=True, ondelete='cascade')
    status = fields.Selection([
        ('active', 'Active'),
        ('archived', 'Archived')
    ], string='Status', default='active', required=True)
    active = fields.Boolean(string='Active', default=True)

class EduManageStudent(models.Model):
    _name = 'edumanage.student'
    _description = 'EduManage Student'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'id desc'

    name = fields.Char(string='Student Name', required=True, tracking=True)
    photo = fields.Binary(string='Student Photo', attachment=True)
    gender = fields.Selection([
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other')
    ], string='Gender', default='male', required=True, tracking=True)
    date_of_birth = fields.Date(string='Date of Birth', tracking=True)

    # Academics
    class_id = fields.Many2one('edumanage.class', string='Class', required=True, tracking=True)
    section_id = fields.Many2one(
        'edumanage.section',
        string='Section',
        required=True,
        tracking=True,
        domain="[('class_id', '=', class_id)]",
    )
    admission_date = fields.Date(string='Admission Date', default=fields.Date.context_today, required=True, tracking=True)
    roll_no = fields.Char(string='Roll Number', tracking=True)
    student_id_code = fields.Char(string='Student ID', required=True, copy=False, readonly=True, default=lambda self: _('New'))

    # Parent Info
    father_name = fields.Char(string='Father\'s Name')
    mother_name = fields.Char(string='Mother\'s Name')
    parent_phone = fields.Char(string='Mobile Number')
    parent_email = fields.Char(string='Email')

    # Address Info
    address = fields.Text(string='Address')
    city = fields.Char(string='City')
    state_id = fields.Many2one('res.country.state', string='State')
    country_id = fields.Many2one('res.country', string='Country', default=lambda self: self.env.ref('base.in', raise_if_not_found=False))

    status = fields.Selection([
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('fee_due', 'Fee Due')
    ], string='Status', default='active', required=True, tracking=True)
    
    fee_status = fields.Selection([
        ('paid', 'Paid'),
        ('due', 'Due'),
        ('overdue', 'Overdue')
    ], string='Fee Status', default='paid', required=True, tracking=True)
    
    attendance_pct = fields.Integer(string='Attendance Percentage', default=100)

    @api.constrains('class_id', 'section_id')
    def _check_section_belongs_to_class(self):
        for student in self:
            if student.section_id and student.class_id and student.section_id.class_id != student.class_id:
                raise ValidationError(_("The selected section does not belong to the selected class."))

    @api.onchange('class_id')
    def _onchange_class_id(self):
        if self.section_id and self.section_id.class_id != self.class_id:
            self.section_id = False

    def _student_to_dict(self, student):
        status_labels = {
            'active': 'Active',
            'inactive': 'Inactive',
            'fee_due': 'Fee Due',
        }
        fee_labels = {
            'paid': 'Paid',
            'due': 'Due',
            'overdue': 'Overdue',
        }
        class_display = student.class_id.name or ''
        if student.section_id:
            class_display = f"{class_display}{student.section_id.name}"
        return {
            'id': student.id,
            'name': student.name,
            'studentId': student.student_id_code,
            'className': class_display,
            'rollNo': student.roll_no or '',
            'gender': student.gender,
            'guardian': student.father_name or student.mother_name or '',
            'feeStatus': fee_labels.get(student.fee_status, student.fee_status.capitalize()),
            'attendancePct': student.attendance_pct,
            'status': student.status,
            'statusLabel': status_labels.get(student.status, student.status.capitalize()),
            'photo': student.photo or '',
            'class_id': [student.class_id.id, student.class_id.name] if student.class_id else False,
            'section_id': [student.section_id.id, student.section_id.name] if student.section_id else False,
            'admission_date': student.admission_date.strftime('%Y-%m-%d') if student.admission_date else '',
            'dob': student.date_of_birth.strftime('%Y-%m-%d') if student.date_of_birth else '',
            'father_name': student.father_name or '',
            'mother_name': student.mother_name or '',
            'parent_phone': student.parent_phone or '',
            'parent_email': student.parent_email or '',
            'address': student.address or '',
            'city': student.city or '',
            'state_id': [student.state_id.id, student.state_id.name] if student.state_id else False,
            'country_id': [student.country_id.id, student.country_id.name] if student.country_id else False,
        }

    @api.model
    def get_admission_form_options(self):
        """Classes, sections, and default country for the admission form."""
        classes = self.env['edumanage.class'].search([('active', '=', True)], order='name')
        classes_data = []
        for cls in classes:
            sections = cls.section_ids.filtered(lambda s: s.active)
            classes_data.append({
                'id': cls.id,
                'name': cls.name,
                'sections': [{'id': s.id, 'name': s.name} for s in sections],
            })
        india = self.env.ref('base.in', raise_if_not_found=False)
        return {
            'classes': classes_data,
            'default_country_id': india.id if india else False,
        }

    @api.model
    def get_student_profile(self, student_id):
        student = self.browse(student_id)
        if not student.exists():
            return False
        return self._student_to_dict(student)

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('student_id_code', _('New')) == _('New'):
                seq = self.env['ir.sequence'].next_by_code('edumanage.student') or 'EDU-2026-0000'
                vals['student_id_code'] = seq
        return super(EduManageStudent, self).create(vals_list)

    @api.model
    def check_and_populate_demo_data(self):
        if self.search_count([]) == 0:
            demo_data = [
                {"name": "Arjun Kumar", "class": "Class 10", "section": "A", "roll": "12", "gender": "male", "guardian": "Raj Kumar", "fee": "paid", "att": 94, "status": "active"},
                {"name": "Priya Mehta", "class": "Class 9", "section": "B", "roll": "08", "gender": "female", "guardian": "Sanjay Mehta", "fee": "due", "att": 91, "status": "active"},
                {"name": "Rahul Verma", "class": "Class 10", "section": "A", "roll": "18", "gender": "male", "guardian": "Vikram Verma", "fee": "paid", "att": 88, "status": "active"},
                {"name": "Sneha Rao", "class": "Class 6", "section": "A", "roll": "05", "gender": "female", "guardian": "Anand Rao", "fee": "paid", "att": 97, "status": "active"},
                {"name": "Aditya Singh", "class": "Class 10", "section": "A", "roll": "22", "gender": "male", "guardian": "Mohit Singh", "fee": "overdue", "att": 82, "status": "active"},
                {"name": "Meenal Joshi", "class": "Class 8", "section": "A", "roll": "15", "gender": "female", "guardian": "Deepak Joshi", "fee": "paid", "att": 96, "status": "active"},
                {"name": "Karan Patel", "class": "Class 9", "section": "B", "roll": "27", "gender": "male", "guardian": "Nilesh Patel", "fee": "due", "att": 79, "status": "inactive"},
                {"name": "Ananya Sharma", "class": "Class 7", "section": "B", "roll": "03", "gender": "female", "guardian": "Vivek Sharma", "fee": "paid", "att": 93, "status": "active"},
                {"name": "Rohan Gupta", "class": "Class 8", "section": "A", "roll": "09", "gender": "male", "guardian": "Suresh Gupta", "fee": "paid", "att": 90, "status": "active"},
                {"name": "Ishita Desai", "class": "Class 6", "section": "A", "roll": "11", "gender": "female", "guardian": "Mahesh Desai", "fee": "overdue", "att": 85, "status": "active"},
                {"name": "Varun Nair", "class": "Class 7", "section": "B", "roll": "20", "gender": "male", "guardian": "Ramesh Nair", "fee": "paid", "att": 92, "status": "active"},
                {"name": "Kavya Reddy", "class": "Class 10", "section": "A", "roll": "14", "gender": "female", "guardian": "Krishna Reddy", "fee": "paid", "att": 95, "status": "active"},
            ]
            
            for item in demo_data:
                cls = self.env['edumanage.class'].search([('name', '=', item['class'])], limit=1)
                if not cls:
                    cls = self.env['edumanage.class'].create({'name': item['class']})
                sec = self.env['edumanage.section'].search([('name', '=', item['section']), ('class_id', '=', cls.id)], limit=1)
                if not sec:
                    sec = self.env['edumanage.section'].create({'name': item['section'], 'class_id': cls.id})
                
                self.create({
                    'name': item['name'],
                    'class_id': cls.id,
                    'section_id': sec.id,
                    'roll_no': item['roll'],
                    'gender': item['gender'],
                    'father_name': item['guardian'],
                    'fee_status': item['fee'],
                    'attendance_pct': item['att'],
                    'status': item['status'],
                })
        
        # Load and return all students
        return [self._student_to_dict(s) for s in self.search([])]
