# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
from odoo.exceptions import ValidationError, UserError
import re


class InstitutionSetupWizard(models.TransientModel):
    _name = 'edumanage.institution.wizard'
    _description = 'EduManage Institution Setup Wizard'

    # ── Step tracking ─────────────────────────────────────────
    current_step = fields.Integer(string='Current Step', default=1)
    total_steps = fields.Integer(string='Total Steps', default=3)

    # ── Step 1: Identity ──────────────────────────────────────
    institution_type = fields.Selection(
        selection=[
            ('school', 'School'),
            ('tuition', 'Tuition Centre'),
        ],
        string='Institution Type',
        default='school',
    )
    logo = fields.Binary(string='Institution Logo', attachment=True)
    logo_filename = fields.Char()
    name = fields.Char(string='Institution Name')

    # ── Step 2: Contact & Location ────────────────────────────
    email = fields.Char(string='Official Email')
    phone = fields.Char(string='Phone Number')
    website = fields.Char(string='Website')
    city = fields.Char(string='City')
    state_id = fields.Many2one('res.country.state', string='State')
    country_id = fields.Many2one(
        'res.country', string='Country',
        default=lambda self: self.env.ref('base.in', raise_if_not_found=False),
    )
    zip = fields.Char(string='PIN / ZIP')
    street = fields.Char(string='Address')

    # ── Step 3: Academic Profile ──────────────────────────────
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
    established_year = fields.Integer(string='Established Year')
    total_students = fields.Selection(
        selection=[
            ('lt100', 'Less than 100'),
            ('100_500', '100 – 500'),
            ('500_1000', '500 – 1,000'),
            ('1000_3000', '1,000 – 3,000'),
            ('gt3000', 'More than 3,000'),
        ],
        string='Student Strength',
    )

    # ── Linked record ─────────────────────────────────────────
    institution_id = fields.Many2one(
        'edumanage.institution',
        string='Linked Institution',
    )

    def _validate_step(self, step):
        if step == 1:
            if not self.name:
                raise ValidationError(_('Please enter your institution name.'))
            if not self.institution_type:
                raise ValidationError(_('Please select your institution type.'))
        elif step == 2:
            if not self.email:
                raise ValidationError(_('Please enter your official email address.'))
            pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
            if not re.match(pattern, self.email):
                raise ValidationError(_('Please enter a valid email address.'))
            if not self.phone:
                raise ValidationError(_('Please enter your phone number.'))
            if not self.city:
                raise ValidationError(_('Please enter your city.'))

    def action_next_step(self):
        self._validate_step(self.current_step)
        self.current_step = min(self.current_step + 1, self.total_steps)
        return self._reopen()

    def action_prev_step(self):
        self.current_step = max(self.current_step - 1, 1)
        return self._reopen()

    def action_complete_setup(self):
        self._validate_step(1)
        self._validate_step(2)

        vals = {
            'name': self.name,
            'institution_type': self.institution_type,
            'logo': self.logo,
            'logo_filename': self.logo_filename,
            'email': self.email,
            'phone': self.phone,
            'website': self.website,
            'city': self.city,
            'state_id': self.state_id.id,
            'country_id': self.country_id.id,
            'zip': self.zip,
            'street': self.street,
            'board_affiliation': self.board_affiliation,
            'affiliation_number': self.affiliation_number,
            'established_year': self.established_year,
            'total_students': self.total_students,
            'setup_complete': True,
        }

        if self.institution_id:
            self.institution_id.write(vals)
            institution = self.institution_id
        else:
            institution = self.env['edumanage.institution'].create(vals)

        return {
            'type': 'ir.actions.act_window',
            'name': _('Institution'),
            'res_model': 'edumanage.institution',
            'res_id': institution.id,
            'view_mode': 'form',
            'target': 'current',
        }

    def _reopen(self):
        return {
            'type': 'ir.actions.act_window',
            'name': _('Institution Setup'),
            'res_model': self._name,
            'res_id': self.id,
            'view_mode': 'form',
            'target': 'fullscreen',
            'context': self.env.context,
        }
