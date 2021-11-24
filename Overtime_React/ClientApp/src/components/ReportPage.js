import React, { Component } from 'react';
import Button from 'react-bootstrap/Button';
import { Link } from 'react-router-dom';
import { DayForm } from './DayForm.js';
import { Container, Row, Col, ButtonGroup, ButtonToolbar } from 'reactstrap';
import Modal from 'react-bootstrap/Modal'
import { trackPromise } from 'react-promise-tracker';
import fileDownload from 'js-file-download';
const devSite = "overtime.ybstn.ru";//"localhost:5001";

export class ReportPage extends Component {

    constructor(props) {
        super(props);
        this.state = {
            DaysList: [], DaysColors:[], clientData: null, fromDate: "", toDate: "",
            DayData: null, NonFormatedSelectedDate: null, modalDay: false,
            seltedRecordId: "", TotalSumm: 0,
            overtimeHourStart: "", overtimeHourCost: "", holidayNightCost: ""
        };
        this.loadData = this.loadData.bind(this);
        this.getOvertimeDates = this.getOvertimeDates.bind(this);
        this.loadSettingsData = this.loadSettingsData.bind(this);
        this.SelectRecord = this.SelectRecord.bind(this);
        this.RemoveRec = this.RemoveRec.bind(this);
        this.modalDayToggle = this.modalDayToggle.bind(this);
        this.EditDayFromReport = this.EditDayFromReport.bind(this);
        this.DayFormSubmit = this.DayFormSubmit.bind(this);
        this.reportDownload = this.reportDownload.bind(this);
        this.download = this.download.bind(this);
        const fromDateFromState = "";
        const toDateFromState = "";
    }
    componentDidMount() {
        if (this.props.location.state) {
             this.fromDateFromState = this.props.location.state.startAndlastDaysArrayForReport[0];
             this.toDateFromState = this.props.location.state.startAndlastDaysArrayForReport[1];
        }
        this.loadSettingsData();
    }
    loadSettingsData() {
        let locStorageJson = JSON.parse(localStorage.getItem("currentUser"));
        let id = locStorageJson["iD"];
        let name = locStorageJson["fullName"];
        let token = locStorageJson["jwtToken"];
        var url = new URL("https://" + devSite +"/home/GetSettings");
        url.search = new URLSearchParams({ id: id, name: name });
        trackPromise(
            fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": "Bearer " + token
            }
        }).then(response => response.json())
            .then(data => {
                this.setState({
                    overtimeHourStart: data.overtimeHourStart,
                    overtimeHourCost: data.overtimeHourCost,
                    holidayNightCost: data.holidayNightCost
                });
                this.loadData();
            })
        );
    }
    loadData() {
        let locStorageJson = JSON.parse(localStorage.getItem("currentUser"));
        let id = locStorageJson["iD"];
        let name = locStorageJson["fullName"];
        let token = locStorageJson["jwtToken"];
        var url = new URL("https://" + devSite +"/Home");
        url.search = new URLSearchParams({ id: id, name: name });
        
        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": "Bearer " + token
            }
        }).then(response => response.json()).then(data=> {
        
            this.getOvertimeDates(data);
        });
    }
    
    getOvertimeDates(clientData) {
        this.setState({ clientData: clientData });
        let dates = clientData.map((DayData) => DayData.date);
        let fromDate = "";
        let toDate = "";
        let sortedList = dates;
        sortedList.sort(function (a, b) {
            let dateSplitedOne = a.split('.').reverse().join('');
            let dateSplitedTwo = b.split('.').reverse().join('');
            if (dateSplitedOne < dateSplitedTwo) {
                        return -1;
            }
            if (dateSplitedOne > dateSplitedTwo) {
                        return 1;
            }
            return 0;
        });
        if (this.fromDateFromState !== "" && this.toDateFromState !== "") {
            let tempDataArray = [];
            sortedList.forEach((OVdate) => {
                let OVDateSplited = OVdate.split('.');
                let OVDateInFormat = new Date(("20" + OVDateSplited[2]), (OVDateSplited[1] - 1), OVDateSplited[0]);
                if (OVDateInFormat >= this.fromDateFromState && OVDateInFormat <= this.toDateFromState) {
                    tempDataArray.push(OVdate);
                }
            });

            sortedList = tempDataArray;
            fromDate = Intl.DateTimeFormat('ru-RU', { year: '2-digit', month: '2-digit', day: '2-digit' }).format(this.fromDateFromState);
            toDate = Intl.DateTimeFormat('ru-RU', { year: '2-digit', month: '2-digit', day: '2-digit' }).format(this.toDateFromState);
        }
        else {
            fromDate = sortedList[0];
            toDate = sortedList[sortedList.length - 1];
        }

        let UpOvertimeLimit = parseInt(this.state.holidayNightCost) + (parseInt(this.state.overtimeHourCost) * (24 - parseInt(this.state.overtimeHourStart)));
        let daysColor = [];
        let DayCost = 0;
        let CostPercent = 0;
        let tempSumm = 0;
        let roundedVal = 0;
        let RedColorVal = 0;
        sortedList.forEach((OVdate) => {
            let thisDateValue = this.state.clientData.find(x => x.date === OVdate);
             DayCost = parseInt(thisDateValue.cost) + parseInt(thisDateValue.otherPays);
            roundedVal = Math.round((DayCost / UpOvertimeLimit) * 100) / 100;
            RedColorVal = Math.round(255 * roundedVal);
           
            daysColor.push(RedColorVal);
            tempSumm = (tempSumm + parseInt(thisDateValue.cost) + parseInt(thisDateValue.otherPays))
        });
        //alert("dayscolor= "JSON.stringify(daysColor) );
        this.setState({ DaysList: sortedList, DaysColors: daysColor, fromDate: fromDate, toDate: toDate, TotalSumm: tempSumm });
    }
  
    SelectRecord(recordID) {
        this.setState({ seltedRecordId: recordID });
    }
    RemoveRec(recordID) {
        let locStorageJson = JSON.parse(localStorage.getItem("currentUser"));
        let id = locStorageJson["iD"];
        let name = locStorageJson["fullName"];
        let token = locStorageJson["jwtToken"];
        var url = new URL("https://" + devSite +"/home");
        url.search = new URLSearchParams({ id: id, name: name, date: recordID });
        trackPromise(
        fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": "Bearer " + token
            }
        }).then(response => response.json()).then(data => {
            let index = this.state.DaysList.indexOf(recordID);
            let tempDaysList = this.state.DaysList;
            tempDaysList.splice(index, 1);
            this.setState({ clientData: data, DaysList: tempDaysList });
            this.getOvertimeDates(data);
        })
            )
       
    }

    modalDayToggle() {
        this.setState({ modalDay: !this.state.modalDay });

    }
   
    EditDayFromReport(value) {
        let OVDateSplited = value.split('.');
        let OVDateInFormat = new Date(("20" + OVDateSplited[2]), (OVDateSplited[1] - 1), OVDateSplited[0]);
        this.setState({ SelectedDate: value, NonFormatedSelectedDate: OVDateInFormat  });
        if (this.state.clientData.some(x => x.date === value)) {
            let thisDateValue = this.state.clientData.find(x => x.date === value);
            this.setState({ DayData: thisDateValue });
        }
        else {
            this.setState({ DayData: null });
        }
        this.modalDayToggle();
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
    reportDownload()
    {
        let reportArray = [];

        this.state.DaysList.forEach((OVdate) => {
            let thisDateValue = this.state.clientData.find(x => x.date === OVdate);
            let data = { date: thisDateValue.date, holiday: thisDateValue.holiday, place: thisDateValue.place, fromTime: thisDateValue.fromTime, toTime: thisDateValue.toTime, ovTime: thisDateValue.ovTime, totalTime: thisDateValue.totalTime, cost: thisDateValue.cost, otherPays: thisDateValue.otherPays, mailed: false };
            reportArray.push(data);
        });
        let locStorageJson = JSON.parse(localStorage.getItem("currentUser"));
        let id = locStorageJson["iD"];
        let name = locStorageJson["fullName"];
        let token = locStorageJson["jwtToken"];
        var url = new URL("https://" + devSite +"/home/XlsxReport");
        url.search = new URLSearchParams({ id: id, name: name });
        trackPromise(
        fetch(url, {
            method: 'POST',
            body: JSON.stringify(reportArray),
            headers: {
                'Content-Type': 'application/json',
                "Authorization": "Bearer " + token
            }
        }).then(response => response.text())
                .then(ReportPath => this.download(ReportPath))
            )
        
    }
    download(path) {
        let locStorageJson = JSON.parse(localStorage.getItem("currentUser"));
        let id = locStorageJson["iD"];
        let name = locStorageJson["fullName"];
        let token = locStorageJson["jwtToken"];
        var url = new URL("https://" + devSite +"/home/DownloadFile");
        url.search = new URLSearchParams({ path: path });
        let that = this;
        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": "Bearer " + token
            }
        }).then(response => response.blob()).then(blob => {
            let filename = "OvertimeReport(" + that.state.fromDate + "-" + that.state.toDate + ").xlsx";
            fileDownload(blob, filename);
        });
            
    }
    render() {
        let removeRec = this.RemoveRec;
        let toggleDayForm = this.EditDayFromReport;
        let _clientData = this.state.clientData;
         
        
        let _daysColors = this.state.DaysColors;

        var contrPanel = this.SelectRecord;
        var selRecordId = this.state.seltedRecordId;
        var isAnySel = (selRecordId === "") ? false : true;
        let ind = 0;
        return (
            <div>
                <Container fluid>
                <Modal show={this.state.modalDay} fullscreen={true} >
                    <Modal.Body><DayForm onDayFormSubmit={this.DayFormSubmit} SelectedDate={this.state.SelectedDate} NonFormatedSelectedDate={this.state.NonFormatedSelectedDate} onCloseModal={this.modalDayToggle} DayData={this.state.DayData} /></Modal.Body>
                </Modal>
                <Row className="justify-content-center py-0 px-0 row border-bottom border-light">
                    <Col xs="2" className="px-0">
                            <Button variant="secondary" className="MenuButton btnDownload" onClick={this.reportDownload} ></Button>
                    </Col>
                    <Col xs={8} className="align-self-center RecordsClientInfoText px-0 d-none d-md-block" style={{ textAlign: "center" }}>
                        <b>{this.state.fromDate} - {this.state.toDate} = {this.state.TotalSumm}р.</b>
                    </Col>
                    <Col xs={8} className="align-self-center RecordsClientInfoText px-0 d-block d-md-none" style={{ textAlign: "center" }}>
                        <div><b>{this.state.fromDate} - {this.state.toDate}  </b></div>
                        <b>{this.state.TotalSumm}р.</b>
                    </Col>
                    <Col xs="2" className="px-0">
                        <Link  to={{
                            pathname: "/"
                        }}> <Button variant="secondary" className="MenuButton btnBack float-end"></Button>
                        </Link>
                        
                    </Col>
                </Row>
                <div>
                    {
                        this.state.DaysList.map(function (OVdate) {
                            var isSel = (OVdate === selRecordId) ? true : false;
                            let thisDateValue = _clientData.find(x => x.date === OVdate);
                           
                            if (thisDateValue) {
                                let dayColor = _daysColors[ind];
                                
                                ind++;
                                return <OVday key={OVdate} dayData={thisDateValue} dayColor={dayColor} onremove={removeRec} toggleDayForm={toggleDayForm}
                                    isSelected={isSel} SelectRecord={contrPanel} selectRecordId={selRecordId} />
                            }
                        })
                    }
                    <div className="ControlsPanelListComensator py-2" style={{ display: isAnySel ? 'block' : 'none' }}></div>
                    </div>
                </Container>
            </div>
        );
    }

}
class OVday extends React.Component {
    constructor(props) {
        super(props);
        this.state = { dayColor: this.props.dayColor, dayData: this.props.dayData, isThisSelected: this.props.isSelected, selRecordId: this.props.selectRecordId, dayColor: 100};//
        this.onShowControls = this.onShowControls.bind(this);
        this.toggleDayForm = this.toggleDayForm.bind(this);
        this.toggleDelete = this.toggleDelete.bind(this);
    }
    onShowControls(recordId) {
        if (this.props.selectRecordId !== recordId) {
            this.props.SelectRecord(recordId);
        }
        else {
            
            this.props.SelectRecord("");
        }
    }
    static getDerivedStateFromProps(props, state) {

        state.isThisSelected = props.isSelected;
        state.selRecordId = props.selectRecordId;
        state.dayData = props.dayData;
        state.dayColor = props.dayColor;
        
        return null;
    }
    toggleDayForm(recordId) {
        this.props.toggleDayForm(recordId);
    }
    toggleDelete(recordId) {
        this.props.onremove(recordId);
    }
    render() {
        let recId = this.state.dayData.date;
        let curDaycolor = "rgba(" + this.state.dayColor + ",0,20,1)";
        return (
            <div>
                <Row className="ControlsPanel justify-content-center py-2 mx-1 fixed-bottom" style={{ display: this.state.isThisSelected ? 'flex' : 'none' }}>
                    <Col xs={6} style={{ textAlign: "center" }}>
                        <Button variant="secondary" className="btnControlsPanelTwoButt btnEdit" onClick={() =>this.toggleDayForm(recId)}></Button>
                       
                    </Col>
                    <Col xs={6} style={{ textAlign: "center" }}>
                        <Button variant="secondary" className="btnControlsPanelTwoButt btnDelete" onClick={() =>this.toggleDelete(recId)}></Button>

                    </Col>
                </Row>
                <Row className="align-items-center RecordRow p-1" onClick={() => this.onShowControls(recId)} style={{ backgroundColor: this.state.isThisSelected ? 'yellow' : curDaycolor, color: this.state.isThisSelected ? 'black' : 'white' }} >
                    <Col xs={6} className="text-left ps-1" >{this.state.dayData.date}  {this.state.dayData.totalTime}  {this.state.dayData.cost + this.state.dayData.otherPays}</Col>
                    <Col xs={6} className="text-left pe-1">{this.state.dayData.place}</Col>
                </Row>
            </div>
        );
    }
}