# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
from odoo.exceptions import ValidationError
import re


class InstitutionSetup(models.Model):
    _name = 'edumanage.institution'
    _description = 'EduManage Institution'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    # ── Identity ──────────────────────────────────────────────
    name = fields.Char(
        string='Institution Name',
        required=True,
        tracking=True,
    )
    logo = fields.Binary(
        string='Institution Logo',
        attachment=True,
    )
    logo_filename = fields.Char(string='Logo Filename')

    institution_type = fields.Selection(
        selection=[
            ('school', 'School'),
            ('tuition', 'Tuition Centre'),
        ],
        string='Institution Type',
        required=True,
        default='school',
        tracking=True,
    )

    # ── Contact ───────────────────────────────────────────────
    email = fields.Char(string='Official Email', required=True)
    phone = fields.Char(string='Phone Number', required=True)
    website = fields.Char(string='Website')
    established_year = fields.Integer(string='Established Year')

    # ── Address ───────────────────────────────────────────────
    street = fields.Char(string='Address Line 1')
    street2 = fields.Char(string='Address Line 2')
    city = fields.Char(string='City', required=True)
    state_id = fields.Many2one('res.country.state', string='State')
    zip = fields.Char(string='PIN / ZIP Code')
    country_id = fields.Many2one(
        'res.country', string='Country',
        default=lambda self: self.env.ref('base.in', raise_if_not_found=False),
    )

    # ── Academics ─────────────────────────────────────────────
    board_affiliation = fields.Selection(
        selection=[
            ('cbse', 'CBSE'),
            ('icse', 'ICSE'),
            ('state', 'State Board'),
            ('ib', 'IB (International Baccalaureate)'),
            ('igcse', 'Cambridge IGCSE'),
            ('other', 'Other'),
        ],
        string='Board / Affiliation',
    )
    affiliation_number = fields.Char(string='Affiliation / Registration Number')
    total_students = fields.Selection(
        selection=[
            ('lt100', 'Less than 100'),
            ('100_500', '100 – 500'),
            ('500_1000', '500 – 1,000'),
            ('1000_3000', '1,000 – 3,000'),
            ('gt3000', 'More than 3,000'),
        ],
        string='Approximate Student Strength',
    )

    # ── Status ────────────────────────────────────────────────
    setup_complete = fields.Boolean(
        string='Setup Complete',
        default=False,
        tracking=True,
    )
    active = fields.Boolean(default=True)

    # ── Constraints & Validation ──────────────────────────────
    @api.constrains('email')
    def _check_email(self):
        for rec in self:
            if rec.email:
                pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
                if not re.match(pattern, rec.email):
                    raise ValidationError(_('Please enter a valid email address.'))

    @api.constrains('established_year')
    def _check_year(self):
        for rec in self:
            if rec.established_year:
                if rec.established_year < 1800 or rec.established_year > 2100:
                    raise ValidationError(_('Please enter a valid established year.'))

    def action_complete_setup(self):
        self.ensure_one()
        self.write({'setup_complete': True})
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('Setup Complete!'),
                'message': _('Your institution has been configured successfully. Welcome to EduManage!'),
                'sticky': False,
                'type': 'success',
            },
        }

    def action_open_setup_wizard(self):
        return {
            'type': 'ir.actions.act_window',
            'name': _('Institution Setup'),
            'res_model': 'edumanage.institution.wizard',
            'view_mode': 'form',
            'target': 'fullscreen',
            'context': {'default_institution_id': self.id if self else False},
        }
