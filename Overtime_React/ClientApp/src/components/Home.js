import React, { Component } from 'react';
import { authHeader } from '../helpers/auth-header';
import { handleResponse } from '../helpers/handle-response';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { trackPromise } from "react-promise-tracker";
import { DayForm } from './DayForm.js';
import { Container, Row, Col, Button, ButtonGroup } from 'reactstrap';
import { Link } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal'
import ToggleButton from 'react-bootstrap/ToggleButton'
const devSite = "overtime.ybstn.ru";//"localhost:5001";

export class Home extends Component {
    static displayName = Home.name;
    
    constructor(props) {
        super(props);
        this.state = {
            calendarValue: null,
            SelectedDate: null, NonFormatedSelectedDate:null, ClientData: null, overtimeDates: [], DayData: null,
            single_or_range: false, intervalStartDate:"", intervalLastDate:"", modalDay: false
        };
        this.loadData = this.loadData.bind(this);
        this.calendarChange = this.calendarChange.bind(this);
        this.modalDayToggle = this.modalDayToggle.bind(this);
        this.DayFormSubmit = this.DayFormSubmit.bind(this);
        this.getOvertimeDates = this.getOvertimeDates.bind(this);
        this.calendarIntervalState = this.calendarIntervalState.bind(this);
    }
    loadData() {
        let locStorageJson = JSON.parse(localStorage.getItem("currentUser"));
        let id = locStorageJson["iD"];
        let name = locStorageJson["fullName"];
        let token = locStorageJson["jwtToken"];
        var url = new URL("https://" + devSite+"/Home");
        url.search = new URLSearchParams({ id: id, name: name });
        trackPromise(
        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": "Bearer " + token
            }
        }).then(response => response.json())
                .then(data => this.setState({ ClientData: data })).then(() => { this.getOvertimeDates(); })
        )
    }
    getOvertimeDates() {
        let dates = this.state.ClientData.map((DayData) => DayData.date);
        this.setState({ overtimeDates: dates });
    }
    componentDidMount() {
        this.loadData();
        
    }
    calendarChange(value) {

        if (!this.state.single_or_range) {
           
            let selDateFomat = Intl.DateTimeFormat('ru-RU', { year: '2-digit', month: '2-digit', day: '2-digit' }).format(value);
            this.setState({ SelectedDate: selDateFomat, calendarValue: value });
            this.setState({ NonFormatedSelectedDate: value });
            if (this.state.ClientData.some(x => x.date === selDateFomat)) {

                let thisDateValue = this.state.ClientData.find(x => x.date === selDateFomat);
                this.setState({ DayData: thisDateValue});
            }
            else {
                this.setState({ DayData: null});
            }

            this.modalDayToggle();
        }
        else {
            this.setState({ intervalStartDate: value[0], intervalLastDate: value[1], calendarValue:value });
        }
        
    }
    modalDayToggle() {
        this.setState({ modalDay: !this.state.modalDay });
    }
    DayFormSubmit(dayData) {
        let data = { date: dayData.date, holiday: dayData.holiday, place: dayData.place, fromTime: dayData.fromTime, toTime: dayData.toTime, ovTime: dayData.ovTime, totalTime: dayData.totalTime, cost: dayData.cost, otherPays: dayData.otherPays, mailed: false };
        let locStorageJson = JSON.parse(localStorage.getItem("currentUser"));
        let id = locStorageJson["iD"];
        let name = locStorageJson["fullName"];
        let token = locStorageJson["jwtToken"];
        var url = new URL("https://" + devSite +"/home");
        url.search = new URLSearchParams({ id: id, name: name });
        trackPromise(
        fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                "Authorization": "Bearer " + token
            }
        }).then(response => response.json())
                .then(() => { this.modalDayToggle(); }).then(() => { this.loadData(); })
            )
    }
    calendarIntervalState(val)
    {
        
        if (this.state.single_or_range) {
            let value = null;
            if (this.state.intervalStartDate === "") {
                if (this.state.SelectedDate != null) {
                    let DateSplited = this.state.SelectedDate.split('.');
                    let DateInFormat = new Date(("20" + DateSplited[2]), (DateSplited[1] - 1), DateSplited[0]);
                    value = DateInFormat;
                }
            }
            else {
                value = this.state.intervalStartDate;
            }

            this.setState({ intervalStartDate: "", intervalLastDate: "", calendarValue: value });
        }
        else {
            if (this.state.SelectedDate === null) {
                this.setState({calendarValue: new Date() });
            }
        }
        this.setState({ single_or_range: !this.state.single_or_range});
       
    }
    render() {
        let browserWidth = 0;
        let doubleView = false;
        if (window.outerHeight) {
            browserWidth = window.outerWidth;
        }
        else {
            browserWidth = document.body.clientWidth;
        }
        if (browserWidth > 1000) {
            doubleView = true;
        }
        let startAndlastDaysArrayForReport = [this.state.intervalStartDate, this.state.intervalLastDate];
 
    return (
        <div>
            <Container fluid>
                <Modal show={this.state.modalDay} fullscreen={true} >
                    <Modal.Body><DayForm onDayFormSubmit={this.DayFormSubmit} SelectedDate={this.state.SelectedDate} NonFormatedSelectedDate={this.state.NonFormatedSelectedDate } onCloseModal={this.modalDayToggle} DayData={ this.state.DayData}/></Modal.Body>
                </Modal>
                <Row className="justify-content-center">
                    <Calendar
                        onChange={this.calendarChange}
                        selectRange={this.state.single_or_range}
                        prev2Label={null}
                        next2Label={null}
                        minDetail={"month"}
                        showDoubleView={doubleView}
                        className="TextSize"
                        value={this.state.calendarValue}
                        tileClassName={
                            ({ date }) =>
                            {
                                if (this.state.overtimeDates.length !== 0) {
                                    if (this.state.overtimeDates.some(x => x === Intl.DateTimeFormat('ru-RU', { year: '2-digit', month: '2-digit', day: '2-digit' }).format(date))) { return "react-calendar__tile_highlighted" }
                                }
                            }
                        }
                        locale={"ru-Ru"}
                    />
                </Row>
                <div className="MainPageButtonsWrapper">
                    <Row className="mt-1 mb-2 h-50 ToggbuttRow">
                    <Col className="pt-1 pb-0 ps-0 pe-1">
                        <ToggleButton
                                className="btn btn-secondary w-100 h-100 d-flex justify-content-center align-items-center TextSize "
                            id="toggle-check"
                                type="checkbox"
                            variant={this.state.single_or_range ? "warning" : "secondary"}
                            onChange={this.calendarIntervalState}>
                            ВЫБОР ИНТЕРВАЛА
                          </ToggleButton>
                    </Col>
                    <Col className="pt-1 pb-0 ps-1 pe-0">
                            <Button disabled={true} variant="secondary" className="TextSize  w-100 h-100">ФИНАНСЫ</Button>
                    </Col>
                </Row>
                    <Row className="h-50" >
                    <Col className="pt-0 pb-1 ps-0 pe-1">
                            <Link className="btn btn-secondary w-100 h-100 btnShowRecords" to={{
                            pathname: "/SettingsPage"
                            }}> <Button className="TextSize w-100 h-100">НАСТРОЙКИ</Button>
                        </Link>
                    </Col>
                        <Col className="pt-0 pb-1 ps-1 pe-0">
                            <Link className="btn btn-secondary w-100 h-100 btnShowRecords" to={{
                                pathname: "/ReportPage",
                                state: { startAndlastDaysArrayForReport }
                            }}> <Button className="TextSize w-100 h-100">ОТЧЁТ</Button>
                            </Link>
                            
                    </Col>
                    </Row>
                </div>
            </Container>
      </div>
    );
  }
}
