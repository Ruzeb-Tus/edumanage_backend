# -*- coding: utf-8 -*-
from odoo import models, api

class IrHttp(models.AbstractModel):
    _inherit = 'ir.http'

    def session_info(self):
        result = super().session_info()
        action_ids = {}
        xml_ids = [
            ('dashboard', 'edumanage_dashboard.action_edumanage_dashboard'),
            ('setup_client', 'edumanage_setup.action_edumanage_setup_client'),
            ('institution', 'edumanage_setup.action_edumanage_institution'),
        ]
        for key, xml_id in xml_ids:
            try:
                action = self.env.ref(xml_id, raise_if_not_found=False)
                if action:
                    action_ids[key] = action.id
            except Exception:
                pass
        result['edumanage_actions'] = action_ids
        
        # Override default landing page / home action to be the dashboard
        if 'dashboard' in action_ids:
            result['home_action_id'] = action_ids['dashboard']
            
        return result
