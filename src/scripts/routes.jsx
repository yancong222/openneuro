// dependencies ----------------------------------------------------------

import React from 'react';
import {NotFoundRoute, DefaultRoute, Route} from 'react-router';
import requireAuth from './utils/requireAuth';

// views
import Index    from './common/index.jsx';
import Signin from './user/signin.component.jsx';
import Upload from './upload/upload.component.jsx';
import Home   from './common/views/home.component.jsx';

var Redirect = React.createClass({
  statics: {
    willTransitionTo: function (transition) {
      transition.redirect('signIn');
    }
  },
  render: function () {}
});

// routes ----------------------------------------------------------------

Upload = requireAuth(Upload);

let routes = (
	<Route name="app" path="/" handler={Index}>
		<Route name="signIn" path="sign-in" handler={Signin}/>
		<Route name="upload" path="upload"  handler={Upload}/>
		<Route name="home"   path="home"    handler={Home}/>
		<DefaultRoute handler={Signin}/>
		<NotFoundRoute handler={Redirect}/>
	</Route>
);

export default routes;

