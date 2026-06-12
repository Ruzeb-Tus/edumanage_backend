# -*- coding: utf-8 -*-
from odoo import http
from odoo.addons.web.controllers.home import Home

class EduManageHome(Home):
    @http.route([
        '/dashboard',
        '/institution',
        '/students',
        '/attendance',
        '/fees',
        '/documents',
        '/reports'
    ], type='http', auth="none")
    def edumanage_web_client(self, **kw):
        return self.web_client(**kw)
