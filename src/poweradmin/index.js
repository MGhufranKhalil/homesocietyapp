import $$ from 'dom7';
import Template7 from 'template7';
import PowerAdminPage from './home.f7.html';
import AddSocietyPage from './society.f7.html';
import Util from '../js/util.js';
import App from '../js/app';

const PowerAdmin = {
  init: function() {
    app.routes.splice(0, 0, {
      path: '/pa/home/',
      component: PowerAdminPage,
    });
    app.routes.splice(0, 0, {
      path: '/pa/society/',
      component: AddSocietyPage,
    });
    app.routes.splice(0, 0, {
      path: '/pa/society/:id',
      component: AddSocietyPage,
    });
    app.methods.initDashboard = function() {
      const panelTemplate = Template7.compile($$('script#panel-left-template').html());
  		$$(".panel.panel-left").html(panelTemplate(app.methods.pageData({})));
			$$("#panel-society-name").html("Home Society Admin");
			app.methods.go("/pa/home/", {clearPreviousHistory: true});
			app.data.ready = true;
		};
  }
};

PowerAdmin.init();
