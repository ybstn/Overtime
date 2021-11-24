import React, { Component } from 'react';
import Button from 'react-bootstrap/Button';
import { Container, Row, Col } from 'reactstrap';
import { Link } from 'react-router-dom';
import InputGroup from 'react-bootstrap/InputGroup'
import FormControl from 'react-bootstrap/FormControl'
import { trackPromise } from 'react-promise-tracker';
const devSite = "overtime.ybstn.ru";//"localhost:5001";

export class SettingsPage extends Component {

    constructor(props) {
        super(props);
        this.state = {
            overtimeHourStart: "", hourMinuteRound: "", overtimeHourCost: "", holidayNightCost: ""
             };

        this.onSubmit = this.onSubmit.bind(this);
        this.loadData = this.loadData.bind(this);
        this.getSettingsInfo = this.getSettingsInfo.bind(this);
        this.HourStartTextChanged = this.HourStartTextChanged.bind(this);
        this.HourRoundTextChanged = this.HourRoundTextChanged.bind(this);
        this.HourCostTextChanged = this.HourCostTextChanged.bind(this);
        this.NightCostTextChanged = this.NightCostTextChanged.bind(this); 
    }
    loadData() {
        let locStorageJson = JSON.parse(localStorage.getItem("currentUser"));
        let id = locStorageJson["iD"];
        let name = locStorageJson["fullName"];
        let token = locStorageJson["jwtToken"];
        var url = new URL("https://" + devSite +"/home/GetSettings");
        url.search = new URLSearchParams({ id: id, name: name });
        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": "Bearer " + token
            }
        }).then(response => response.json()).then(data => this.getSettingsInfo(data));
    }
    componentDidMount() {
        this.loadData();
    }
    getSettingsInfo(data) {
        this.setState({ overtimeHourStart: data.overtimeHourStart, hourMinuteRound: data.hourMinuteRound, overtimeHourCost: data.overtimeHourCost, holidayNightCost: data.holidayNightCost });
    }
    HourStartTextChanged(e) {
        this.setState({ overtimeHourStart: e.target.value });
    }
    HourRoundTextChanged(e) {
        this.setState({ hourMinuteRound: e.target.value });
    }
    HourCostTextChanged(e) {
        this.setState({ overtimeHourCost: e.target.value });
    }
    NightCostTextChanged(e) {
        this.setState({ holidayNightCost: e.target.value });
    }
    onSubmit(e) {
        let data = {
            OvertimeHourStart: parseInt(this.state.overtimeHourStart),
            HourMinuteRound: parseInt(this.state.hourMinuteRound),
            OvertimeHourCost: parseInt(this.state.overtimeHourCost),
            HolidayNightCost: parseInt(this.state.holidayNightCost)
        };
        let locStorageJson = JSON.parse(localStorage.getItem("currentUser"));
        let id = locStorageJson["iD"];
        let name = locStorageJson["fullName"];
        let token = locStorageJson["jwtToken"];
        var url = new URL("https://" + devSite +"/home/PostSettings");
        url.search = new URLSearchParams({ id: id, name: name });
        trackPromise(
        fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                "Authorization": "Bearer " + token
            }
        }).then(response => response.json()).then(this.props.history.push('/'))
        )
    }

    render() {
        return (
            <div>
                <Container fluid>
                    <h1 className="text-center mb-3 mt-2">НАСТРОЙКИ</h1>
                    <InputGroup className="mb-3 " >
                        <InputGroup.Text className="text-wrap text-start TextSize" style={{ width: '75%'}}>ЧАС НАЧАЛА ОТСЧЁТА ПЕРЕРАБОТКИ</InputGroup.Text>
                        <FormControl className="text-center TextSize" style={{ width: '25%' }} type="number" value={this.state.overtimeHourStart} onChange={this.HourStartTextChanged} />
                    </InputGroup>
                    <InputGroup  className="mb-3" >
                        <InputGroup.Text className="text-wrap text-start TextSize" style={{ width: '75%' }}>ОКРУГЛЕНИЕ ДО ЧАСА С МИНУТЫ</InputGroup.Text>
                        <FormControl className="text-center TextSize" style={{ width: '25%' }} type="number" value={this.state.hourMinuteRound} onChange={this.HourRoundTextChanged} />
                    </InputGroup>
                    <InputGroup className="mb-3" >
                        <InputGroup.Text className="text-wrap text-start TextSize" style={{ width: '75%' }}>СТОИМОСТЬ ЧАСА ПЕРЕРАБОТКИ</InputGroup.Text>
                        <FormControl className="text-center TextSize" style={{ width: '25%' }} type="number" value={this.state.overtimeHourCost} onChange={this.HourCostTextChanged} />
                    </InputGroup>
                    <InputGroup className="mb-3" >
                        <InputGroup.Text className="text-wrap text-start TextSize" style={{ width: '75%' }}>РАБОТА В ВЫХОДНОЙ ДЕНЬ/НОЧЬЮ</InputGroup.Text>
                        <FormControl className="text-center TextSize" style={{ width: '25%' }} type="number" value={this.state.holidayNightCost} onChange={this.NightCostTextChanged} />
                    </InputGroup>
                    <InputGroup className="mb-3" >
                    <Col className="p-0 me-1">
                        <Link to={{ pathname: "/" }}>
                                <Button variant="secondary" className="TextSize w-100">
                                ОТМЕНИТЬ
                            </Button>
                        </Link>
                    </Col>
                     <Col className="p-0 ms-1">
                            <Button variant="secondary" className="TextSize w-100" onClick={this.onSubmit}>СОХРАНИТЬ</Button>
                     </Col>
                    </InputGroup>
                </Container>
            </div>
        );
    }

}