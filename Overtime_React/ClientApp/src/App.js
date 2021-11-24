import React, { Component } from 'react';
import { Router, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { history } from './helpers/history';
import { authenticationService } from './services/authentication.service';
import { PrivateRoute } from './components/PrivateRoute';
import { LoginPage } from './LoginPage/LoginPage';
import { SettingsPage } from './components/SettingsPage.js'; 
import { ReportPage } from './components/ReportPage.js'; 
import './custom.css'

export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            currentUser: null
        };
    }
  static displayName = App.name;
    componentDidMount() {
        authenticationService.currentUser.subscribe(x => this.setState({ currentUser: x }));


    }
    logout() {
        authenticationService.logout();
        history.push('/login');
    }
  render () {
      return (
          <Router history={history}>
      <Layout>
                  <PrivateRoute exact path='/' component={Home} />
                  <PrivateRoute exact path='/SettingsPage' component={SettingsPage} />
                  <PrivateRoute exact path='/ReportPage' component={ReportPage} />
                  <Route path="/login" component={LoginPage} />
              </Layout>
          </Router>
    );
  }
}
