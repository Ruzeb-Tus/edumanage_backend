# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
from odoo.exceptions import ValidationError


class EduManageStudentDocument(models.Model):
    _name = 'edumanage.student.document'
    _description = 'Student Document'
    _order = 'upload_date desc, id desc'

    student_id = fields.Many2one(
        'edumanage.student', string='Student', required=True, ondelete='cascade', index=True
    )
    name = fields.Char(string='Document Name', required=True)
    doc_type = fields.Selection([
        ('aadhaar', 'Aadhaar Card'),
        ('birth_certificate', 'Birth Certificate'),
        ('leaving_certificate', 'Leaving Certificate'),
        ('previous_school', 'Previous School Documents'),
        ('photo', 'Student Photo'),
        ('other', 'Other Documents'),
    ], string='Document Type', required=True, default='other')
    file = fields.Binary(string='File', required=True, attachment=True)
    filename = fields.Char(string='Filename')
    upload_date = fields.Datetime(string='Uploaded On', default=fields.Datetime.now, readonly=True)
    uploaded_by = fields.Char(string='Uploaded By', default=lambda self: self.env.user.name, readonly=True)

    @api.model
    def get_student_documents(self, student_id):
        docs = self.search([('student_id', '=', int(student_id))], order='upload_date desc, id desc')
        type_labels = dict(self._fields['doc_type'].selection)
        return [{
            'id': d.id,
            'name': d.name,
            'doc_type': d.doc_type,
            'doc_type_label': type_labels.get(d.doc_type, d.doc_type),
            'filename': d.filename or d.name,
            'upload_date': d.upload_date.strftime('%d %b %Y') if d.upload_date else '',
            'uploaded_by': d.uploaded_by or '',
        } for d in docs]

    @api.model
    def upload_student_document(self, student_id, vals):
        name = (vals.get('name') or '').strip()
        if not name:
            raise ValidationError(_("Document name is required."))
        if not vals.get('file'):
            raise ValidationError(_("Please select a file to upload."))
        doc = self.create({
            'student_id': int(student_id),
            'name': name,
            'doc_type': vals.get('doc_type', 'other'),
            'file': vals.get('file'),
            'filename': vals.get('filename') or name,
        })
        return {'id': doc.id, 'name': doc.name}

    @api.model
    def get_document_file(self, doc_id):
        doc = self.browse(int(doc_id))
        if not doc.exists():
            return False
        if not doc.file:
            return False
        return {
            'id': doc.id,
            'name': doc.name,
            'filename': doc.filename or doc.name,
            'file': doc.file,
            'doc_type': doc.doc_type,
        }

    @api.model
    def delete_student_document(self, doc_id):
        doc = self.browse(int(doc_id))
        if doc.exists():
            doc.unlink()
        return True
