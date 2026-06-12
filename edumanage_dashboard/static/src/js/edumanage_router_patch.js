/** @odoo-module **/

import { router, startRouter } from "@web/core/browser/router";
import { session } from "@web/session";

const getDashboardActionId = () => session.edumanage_actions?.dashboard;
const getSetupClientActionId = () => session.edumanage_actions?.setup_client;
const getInstitutionActionId = () => session.edumanage_actions?.institution;

const STATE_TO_URL_MAP = {
    'students': '/students',
    'attendance': '/attendance',
    'fees': '/fees',
    'documents': '/documents',
    'reports': '/reports',
    'dashboard': '/dashboard',
};

const originalStateToUrl = router.stateToUrl;
const originalUrlToState = router.urlToState;

router.stateToUrl = function (state) {
    const dashboardId = getDashboardActionId();
    const setupClientId = getSetupClientActionId();
    const institutionId = getInstitutionActionId();

    // Check for dashboard action
    if (state.action === dashboardId || state.action === 'edumanage_dashboard.action_edumanage_dashboard' || state.action === 'edumanage_dashboard.main') {
        const activeNav = state.activeNav || 'dashboard';
        if (STATE_TO_URL_MAP[activeNav]) {
            return STATE_TO_URL_MAP[activeNav];
        }
    }
    
    // Check for institution actions
    if (state.action === setupClientId || state.action === 'edumanage_setup.action_edumanage_setup_client') {
        return '/institution';
    }
    if (state.action === institutionId || state.action === 'edumanage_setup.action_edumanage_institution') {
        return '/institution';
    }

    return originalStateToUrl.call(router, state);
};

router.urlToState = function (urlObj) {
    const pathname = urlObj.pathname;
    const dashboardId = getDashboardActionId();
    const setupClientId = getSetupClientActionId();

    if (pathname === '/dashboard') {
        return { action: dashboardId || 'edumanage_dashboard.action_edumanage_dashboard' };
    }
    if (pathname === '/institution') {
        return { action: setupClientId || 'edumanage_setup.action_edumanage_setup_client' };
    }
    if (['/students', '/attendance', '/fees', '/documents', '/reports'].includes(pathname)) {
        const activeNav = pathname.substring(1); // e.g. 'students'
        return {
            action: dashboardId || 'edumanage_dashboard.action_edumanage_dashboard',
            activeNav: activeNav
        };
    }

    return originalUrlToState.call(router, urlObj);
};

// Re-initialize the router state using the new urlToState
startRouter();
