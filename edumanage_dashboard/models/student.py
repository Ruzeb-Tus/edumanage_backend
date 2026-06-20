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

    @api.model
    def get_class_form_data(self, class_id):
        cls = self.browse(int(class_id))
        if not cls.exists():
            return False
        students = self.env['edumanage.student'].search([('class_id', '=', cls.id)])
        total_students = len(students)
        active_students = len(students.filtered(lambda s: s.status == 'active'))
        sections = [
            {
                'id': s.id,
                'name': s.name,
                'status': s.status,
                'active': s.active,
                '_new': False,
                '_deleted': False,
            }
            for s in cls.with_context(active_test=False).section_ids
        ]
        return {
            'id': cls.id,
            'name': cls.name,
            'code': cls.code or '',
            'academic_year': cls.academic_year or '',
            'class_teacher': cls.class_teacher or '',
            'status': cls.status,
            'sections': sections,
            'stats': {
                'total_students': total_students,
                'active_students': active_students,
                'total_sections': len([s for s in sections if s['active']]),
            },
        }

    @api.model
    def save_class_form(self, class_id, vals, sections):
        allowed = {'name', 'code', 'academic_year', 'class_teacher', 'status'}
        clean = {k: (v or False) for k, v in vals.items() if k in allowed}

        if class_id:
            cls = self.browse(int(class_id))
            cls.write(clean)
        else:
            cls = self.create(clean)

        Section = self.env['edumanage.section'].with_context(active_test=False)
        for sec in (sections or []):
            sid = sec.get('id')
            is_new = sec.get('_new', False)
            is_deleted = sec.get('_deleted', False)
            is_archived = sec.get('_archived', False)
            sec_name = (sec.get('name') or '').strip()

            if sid and not is_new:
                existing = Section.browse(int(sid))
                if is_deleted:
                    existing.unlink()
                elif is_archived:
                    existing.write({'status': 'archived', 'active': False})
                else:
                    existing.write({'name': sec_name, 'status': sec.get('status', 'active'), 'active': True})
            elif not is_deleted and sec_name:
                self.env['edumanage.section'].create({
                    'name': sec_name,
                    'class_id': cls.id,
                    'status': 'active',
                    'active': True,
                })
        return cls.id

    @api.model
    def archive_class_record(self, class_id):
        self.browse(int(class_id)).write({'active': False, 'status': 'archived'})
        return True

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

    @api.model
    def save_student_profile(self, student_id, vals):
        """Update an existing student from the profile form."""
        student = self.browse(int(student_id))
        if not student.exists():
            raise ValidationError(_("Student not found."))

        write_vals = {}
        if vals.get('name'):
            write_vals['name'] = vals['name'].strip()
        if vals.get('gender'):
            write_vals['gender'] = vals['gender']
        if vals.get('date_of_birth'):
            write_vals['date_of_birth'] = vals['date_of_birth']
        elif 'date_of_birth' in vals and not vals.get('date_of_birth'):
            write_vals['date_of_birth'] = False
        if vals.get('class_id'):
            write_vals['class_id'] = int(vals['class_id'])
        if vals.get('section_id'):
            write_vals['section_id'] = int(vals['section_id'])
        if vals.get('admission_date'):
            write_vals['admission_date'] = vals['admission_date']
        if 'roll_no' in vals:
            write_vals['roll_no'] = (vals.get('roll_no') or '').strip() or False
        if 'father_name' in vals:
            write_vals['father_name'] = (vals.get('father_name') or '').strip() or False
        if 'mother_name' in vals:
            write_vals['mother_name'] = (vals.get('mother_name') or '').strip() or False
        if 'parent_phone' in vals:
            write_vals['parent_phone'] = (vals.get('parent_phone') or '').strip() or False
        if 'parent_email' in vals:
            write_vals['parent_email'] = (vals.get('parent_email') or '').strip() or False
        if 'address' in vals:
            write_vals['address'] = (vals.get('address') or '').strip() or False
        if 'city' in vals:
            write_vals['city'] = (vals.get('city') or '').strip() or False
        if vals.get('state_id'):
            write_vals['state_id'] = int(vals['state_id'])
        elif 'state_id' in vals:
            write_vals['state_id'] = False
        if vals.get('country_id'):
            write_vals['country_id'] = int(vals['country_id'])
        elif 'country_id' in vals:
            write_vals['country_id'] = False
        if vals.get('status'):
            write_vals['status'] = vals['status']
        if vals.get('photo'):
            write_vals['photo'] = vals['photo']

        name = write_vals.get('name', student.name)
        class_id = write_vals.get('class_id', student.class_id.id if student.class_id else False)
        section_id = write_vals.get('section_id', student.section_id.id if student.section_id else False)
        if not name or not str(name).strip():
            raise ValidationError(_("Student name is required."))
        if not class_id:
            raise ValidationError(_("Class is required."))
        if not section_id:
            raise ValidationError(_("Section is required."))

        student.write(write_vals)
        return self._student_to_dict(student)

    @api.model
    def delete_student_record(self, student_id):
        """Permanently delete a student and related fee/document records."""
        student = self.browse(int(student_id))
        if not student.exists():
            return {'success': False, 'message': _('Student not found.')}
        name = student.name
        student.unlink()
        return {'success': True, 'message': _('Student "%s" has been deleted.') % name}

    @api.model
    def get_student_fee_history(self, student_id):
        fees = self.env['edumanage.student.fee'].search(
            [('student_id', '=', int(student_id))], order='due_date desc, id desc'
        )
        status_labels = {
            'pending': 'Pending',
            'partial': 'Partial',
            'paid': 'Paid',
            'overdue': 'Overdue',
        }
        result = []
        for fee in fees:
            last_payment = fee.payment_ids.sorted('collection_date', reverse=True)[:1]
            result.append({
                'id': fee.id,
                'fee_month': fee.fee_month or 'Annual',
                'academic_year': fee.academic_year or '',
                'total_amount': fee.total_amount,
                'amount_paid': fee.amount_paid,
                'remaining_due': fee.remaining_due,
                'status': fee.status,
                'status_label': status_labels.get(fee.status, fee.status.title()),
                'due_date': fee.due_date.strftime('%d %b %Y') if fee.due_date else '',
                'payment_date': (
                    last_payment.collection_date.strftime('%d %b %Y')
                    if last_payment and last_payment.collection_date else ''
                ),
            })
        return result

    @api.model
    def get_student_receipts(self, student_id):
        payments = self.env['edumanage.fee.payment'].search(
            [('student_id', '=', int(student_id))], order='collection_date desc, id desc'
        )
        pm_labels = dict(self.env['edumanage.fee.payment']._fields['payment_method'].selection)
        return [{
            'id': p.id,
            'receipt_number': p.name,
            'fee_month': p.fee_month or '',
            'academic_year': p.academic_year or '',
            'collection_date': p.collection_date.strftime('%d %b %Y') if p.collection_date else '',
            'amount_collected': p.amount_collected,
            'payment_method': pm_labels.get(p.payment_method, p.payment_method),
        } for p in payments]

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
            import datetime
            from datetime import timedelta
            import base64
            
            today = fields.Date.today()
            
            # 1. Create Classes
            classes_info = [
                {"name": "Class 10", "code": "CLS-10", "teacher": "Mr. Sharma"},
                {"name": "Class 9", "code": "CLS-09", "teacher": "Mrs. Verma"},
                {"name": "Class 8", "code": "CLS-08", "teacher": "Miss Gupta"},
                {"name": "Class 7", "code": "CLS-07", "teacher": "Mr. Nair"},
                {"name": "Class 6", "code": "CLS-06", "teacher": "Mrs. Joshi"},
                {"name": "Class 5", "code": "CLS-05", "teacher": "Mr. Rao"},
            ]
            class_map = {}
            for c_info in classes_info:
                cls = self.env['edumanage.class'].search([('name', '=', c_info['name'])], limit=1)
                if not cls:
                    cls = self.env['edumanage.class'].create({
                        'name': c_info['name'],
                        'code': c_info['code'],
                        'class_teacher': c_info['teacher'],
                    })
                class_map[c_info['name']] = cls
            
            # 2. Create Sections
            sections_info = [
                {"class": "Class 10", "name": "A"},
                {"class": "Class 10", "name": "B"},
                {"class": "Class 10", "name": "C"},
                {"class": "Class 9", "name": "A"},
                {"class": "Class 9", "name": "B"},
                {"class": "Class 8", "name": "A"},
                {"class": "Class 7", "name": "B"},
                {"class": "Class 6", "name": "A"},
                {"class": "Class 5", "name": "C"},
            ]
            sec_map = {}
            for s_info in sections_info:
                cls = class_map[s_info['class']]
                sec = self.env['edumanage.section'].search([('name', '=', s_info['name']), ('class_id', '=', cls.id)], limit=1)
                if not sec:
                    sec = self.env['edumanage.section'].create({
                        'name': s_info['name'],
                        'class_id': cls.id,
                    })
                sec_map[(s_info['class'], s_info['name'])] = sec

            # 3. Create Fee Structures
            fee_structures = [
                {"class": "Class 10", "amount": 15000},
                {"class": "Class 9", "amount": 12000},
                {"class": "Class 8", "amount": 10000},
                {"class": "Class 7", "amount": 9000},
                {"class": "Class 6", "amount": 8000},
                {"class": "Class 5", "amount": 7000},
            ]
            fee_struct_map = {}
            for fs_info in fee_structures:
                cls = class_map[fs_info['class']]
                fs = self.env['edumanage.fee.structure'].search([
                    ('class_id', '=', cls.id),
                    ('academic_year', '=', '2026-27'),
                ], limit=1)
                if not fs:
                    fs = self.env['edumanage.fee.structure'].create({
                        'class_id': cls.id,
                        'amount': fs_info['amount'],
                        'academic_year': '2026-27',
                        'status': 'draft',
                    })
                fee_struct_map[fs_info['class']] = fs

            # 4. Create Students
            demo_students = [
                {"name": "Arjun Kumar", "class": "Class 10", "section": "A", "roll": "12", "gender": "male", "guardian": "Raj Kumar", "fee": "paid", "att": 94, "status": "active", "dob": today - timedelta(days=365*15 + 10)},
                {"name": "Priya Mehta", "class": "Class 9", "section": "B", "roll": "08", "gender": "female", "guardian": "Sanjay Mehta", "fee": "due", "att": 91, "status": "active", "dob": today - timedelta(days=365*14 + 40)},
                {"name": "Rahul Verma", "class": "Class 10", "section": "A", "roll": "18", "gender": "male", "guardian": "Vikram Verma", "fee": "paid", "att": 88, "status": "active", "dob": today - timedelta(days=365*15 + 150)},
                {"name": "Sneha Rao", "class": "Class 6", "section": "A", "roll": "05", "gender": "female", "guardian": "Anand Rao", "fee": "paid", "att": 97, "status": "active", "dob": today - timedelta(days=365*11 + 22)},
                {"name": "Aditya Singh", "class": "Class 10", "section": "A", "roll": "22", "gender": "male", "guardian": "Mohit Singh", "fee": "overdue", "att": 82, "status": "active", "dob": today - timedelta(days=365*15 + 310)},
                {"name": "Meenal Joshi", "class": "Class 8", "section": "A", "roll": "15", "gender": "female", "guardian": "Deepak Joshi", "fee": "paid", "att": 96, "status": "active", "dob": today - timedelta(days=365*13 + 55)},
                {"name": "Karan Patel", "class": "Class 9", "section": "B", "roll": "27", "gender": "male", "guardian": "Nilesh Patel", "fee": "due", "att": 79, "status": "inactive", "dob": today - timedelta(days=365*14 + 180)},
                {"name": "Ananya Sharma", "class": "Class 7", "section": "B", "roll": "03", "gender": "female", "guardian": "Vivek Sharma", "fee": "paid", "att": 93, "status": "active", "dob": today - timedelta(days=365*12 + 100)},
                {"name": "Rohan Gupta", "class": "Class 8", "section": "A", "roll": "09", "gender": "male", "guardian": "Suresh Gupta", "fee": "paid", "att": 90, "status": "active", "dob": today - timedelta(days=365*13 + 210)},
                {"name": "Ishita Desai", "class": "Class 6", "section": "A", "roll": "11", "gender": "female", "guardian": "Mahesh Desai", "fee": "overdue", "att": 85, "status": "active", "dob": today - timedelta(days=365*11 + 95)},
                {"name": "Varun Nair", "class": "Class 7", "section": "B", "roll": "20", "gender": "male", "guardian": "Ramesh Nair", "fee": "paid", "att": 92, "status": "active", "dob": today - timedelta(days=365*12 + 5)},
                {"name": "Kavya Reddy", "class": "Class 10", "section": "A", "roll": "14", "gender": "female", "guardian": "Krishna Reddy", "fee": "paid", "att": 95, "status": "active", "dob": today.replace(year=today.year - 15)},
                {"name": "Rajesh Patel", "class": "Class 10", "section": "B", "roll": False, "gender": "male", "guardian": "Harish Patel", "fee": "due", "att": 90, "status": "active", "dob": today - timedelta(days=365*15 + 75)},
                {"name": "Sunita Rao", "class": "Class 9", "section": "A", "roll": False, "gender": "female", "guardian": "Vijay Rao", "fee": "due", "att": 89, "status": "active", "dob": today - timedelta(days=365*14 + 120)},
            ]

            created_students = []
            for item in demo_students:
                cls = class_map[item['class']]
                sec = sec_map[(item['class'], item['section'])]
                
                stu = self.create({
                    'name': item['name'],
                    'class_id': cls.id,
                    'section_id': sec.id,
                    'roll_no': item['roll'],
                    'gender': item['gender'],
                    'father_name': item['guardian'],
                    'fee_status': item['fee'],
                    'attendance_pct': item['att'],
                    'status': item['status'],
                    'date_of_birth': item['dob'],
                    'admission_date': today - timedelta(days=item.get('days_ago', 10)),
                })
                created_students.append((stu, item))

            # 5. Confirm Fee Structures to auto-generate student fee assignments
            for fs in fee_struct_map.values():
                fs.action_confirm()

            # 6. Apply payment status and create actual payments
            student_fees = self.env['edumanage.student.fee'].search([])
            student_config_map = {item['name']: item for item in demo_students}
            
            payment_days = [3, 1, 5, 2, 0, 4]
            payment_idx = 0
            
            for s_fee in student_fees:
                cfg = student_config_map.get(s_fee.student_id.name)
                if not cfg:
                    continue
                
                if cfg['fee'] == 'paid':
                    days_ago = payment_days[payment_idx % len(payment_days)]
                    payment_idx += 1
                    
                    self.env['edumanage.fee.payment'].create({
                        'student_fee_id': s_fee.id,
                        'amount_collected': s_fee.total_amount,
                        'payment_method': 'upi' if payment_idx % 2 == 0 else 'cash',
                        'collection_date': today - timedelta(days=days_ago),
                        'remarks': 'Full annual fee collection.',
                    })
                elif cfg['fee'] == 'overdue':
                    s_fee.write({
                        'due_date': today - timedelta(days=15),
                    })
                elif cfg['fee'] == 'due':
                    s_fee.write({
                        'due_date': today + timedelta(days=15),
                    })

            # 7. Create some documents
            dummy_pdf = base64.b64encode(b"Dummy PDF Content")
            for student_name, doc_name, doc_type in [
                ("Arjun Kumar", "Aadhaar_Arjun.pdf", "aadhaar"),
                ("Meenal Joshi", "BirthCert_Meenal.pdf", "birth_certificate"),
                ("Sneha Rao", "LeavingCert_Sneha.pdf", "leaving_certificate")
            ]:
                stu = self.search([('name', '=', student_name)], limit=1)
                if stu:
                    self.env['edumanage.student.document'].create({
                        'student_id': stu.id,
                        'name': doc_name,
                        'doc_type': doc_type,
                        'file': dummy_pdf,
                        'filename': doc_name,
                    })

        return [self._student_to_dict(s) for s in self.search([])]
