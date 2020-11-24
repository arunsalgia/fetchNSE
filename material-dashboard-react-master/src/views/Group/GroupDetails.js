import React, {useEffect, useState ,useContext} from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
// import TextField from '@material-ui/core/TextField';
import Link from '@material-ui/core/Link';
import { Route } from 'react-router-dom';
// import Grid from '@material-ui/core/Grid';
// import Box from '@material-ui/core/Box';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Switch from '@material-ui/core/Switch';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import { UserContext } from "../../UserContext";
import axios from "axios";
import { ValidatorForm, TextValidator} from 'react-material-ui-form-validator';
import red from '@material-ui/core/colors/red';
import blue from '@material-ui/core/colors/blue';
import { useHistory } from "react-router-dom";
import {validateSpecialCharacters, validateEmail} from "views/functions.js";
import {BlankArea} from "CustomComponents/CustomComponents.js"
import { useParams } from "react-router";
import GroupMember from "views/Group/GroupMember.js"

// const [myGroupName, setMyGroupName] = useState("");

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  button: {
    margin: theme.spacing(0, 1, 0),
  },
  groupName:  {
    // right: 0,
    fontSize: '12px',
    color: blue[700],
    // position: 'absolute',
    alignItems: 'center',
    marginTop: '0px',
},
error:  {
      // right: 0,
      fontSize: '12px',
      color: red[700],
      // position: 'absolute',
      alignItems: 'center',
      marginTop: '0px',
  },
}));

var myGroupName = "";

class ChildComp extends React.Component {

  componentDidMount()  {
    // custom rule will have name 'isPasswordMatch'
    // ValidatorForm.addValidationRule('isPasswordMatch', (value) => {
    //   return (value === this.props.p1)
    // });

    // ValidatorForm.addValidationRule('minLength', (value) => {
    //   return (value.length >= 6)
    // });

    ValidatorForm.addValidationRule('noSpecialCharacters', (value) => {
      return validateSpecialCharacters(value);
    });

    // ValidatorForm.addValidationRule('isEmailOK', (value) => {
    //   return validateEmail(value);
    // });
  }

  
  componentWillUnmount() {
    // remove rule when it is not needed
    // ValidatorForm.removeValidationRule('isPasswordMatch');
    // ValidatorForm.removeValidationRule('isEmailOK');
    // ValidatorForm.removeValidationRule('minLength');
    ValidatorForm.removeValidationRule('noSpecialCharacters');   
  }

  render() {
    return <br/>;
  }

}


export default function GroupDetails() {
const classes = useStyles();
const history = useHistory();
const [registerStatus, setRegisterStatus] = useState(0);
const [myDisplayName, setDisplayName] = useState("");
const [myAdminSwitch, setMyAdminSwitch] = useState(false);
const [myDefaultSwitch, setMyDefaultSwitch] = useState(false);
const [myCurrentSwitch, setMyCurrentSwitch] = useState(false);
const [masterDisplayName, setMasterDisplayName] = useState("");
const [masterDefaultSwitch, setMasterDefaultSwitch] = useState(false);
const [masterCurrentSwitch, setMasterCurrentSwitch] = useState(false);

  const { setUser } = useContext(UserContext);

  useEffect(() => {
    myGroupName = window.localStorage.getItem("gdName")

    setDisplayName(window.localStorage.getItem("gdDisplay"));
    setMasterDisplayName(window.localStorage.getItem("gdDisplay"));

    setMyAdminSwitch(window.localStorage.getItem("gdAdmin").toLowerCase() === "admin");

    setMyCurrentSwitch(window.localStorage.getItem("gdCurrent").toLowerCase() === "true");
    setMasterCurrentSwitch(window.localStorage.getItem("gdCurrent").toLowerCase() === "true");

    setMyDefaultSwitch(window.localStorage.getItem("gdDefault").toLowerCase() === "true");
    setMasterDefaultSwitch(window.localStorage.getItem("gdDefault").toLowerCase() === "true");
    
  }, [])

  async function updateFranchiseName(newGid, newName) {
    let sts = await fetch(`/group/setfranchisename/${localStorage.getItem("uid")}/${newGid}/${newName}`);
  }


  async function updateDefaultGroup(newGid) {
    let sts = await fetch(`/group/setdefaultgroup/${localStorage.getItem("uid")}/${newGid}`)
  }

  const handleSubmit = async() => {
    console.log("Submit command provided");

    if (masterDisplayName != myDisplayName) {
      console.log(`New display name ${myDisplayName}`);
      await updateFranchiseName(localStorage.getItem("gdGid"), myDisplayName)
    }
    if (masterCurrentSwitch != myCurrentSwitch) {
      console.log("New Current");
        // var myElement;
        // window.localStorage.setItem("gdGid", ggg.gid.toString());
        // window.localStorage.setItem("gdName", ggg.groupName)
        // window.localStorage.setItem("gdDisplay", ggg.displayName)
        // window.localStorage.setItem("gdAdmin", ggg.admin.toString());
        // window.localStorage.setItem("gdCurrent", (newCurrentGroup === ggg.groupName) ? "true" : "false");
        // window.localStorage.setItem("gdDefault", ggg.defaultGroup.toString());
        // window.localStorage.setItem("gdTournament", ggg.tournament);
        localStorage.setItem("gid", localStorage.getItem("gdGid"));
        localStorage.setItem("groupName", localStorage.getItem("gdName"));
        localStorage.setItem("displayName", myDisplayName);
        localStorage.setItem("tournament", localStorage.getItem("gdTournament"));
        localStorage.setItem("admin", localStorage.getItem("gdAdmin"))
        setUser({ uid: localStorage.getItem("uid"), admin: (localStorage.getItem("admin").toLowerCase() === "admin")})    
    }

    if (masterDefaultSwitch != myDefaultSwitch) {
      console.log("New Default");
      await updateDefaultGroup(localStorage.getItem("gdGid"));
    }
    // all done
    history.push("/admin/mygroup")

  }


  function ShowResisterStatus() {
    // console.log(`Status is ${registerStatus}`);
    let myMsg;
    switch (registerStatus) {
      case 200:
        // setUserName("");
        // setPassword("");
        // setRepeatPassword("");
        // setEmail("");
        myMsg = `User ${userName} successfully regisitered.`;
        break;
      case 602:
        myMsg = "User Name already in use";
        break;
      case 603:
        myMsg = "Email id already in use";
        break;
      default:
          myMsg = "";
          break;
    }
    return(
        <Typography className={(registerStatus === 200) ? classes.root : classes.error}>{myMsg}</Typography>
    )
  }

  function AdminSwitch() {
    return (
        <Typography component="div">IsGroupAdmin : 
         <Switch color="secondary" checked={myAdminSwitch} name="adminSw" inputProps={{ 'aria-label': 'primary checkbox' }}/>
        </Typography>
    )
  }

  function handleCurrent() {
    //   console.log(myCurrentSwitch);
      setMyCurrentSwitch(!myCurrentSwitch);
  }

  function CurrentSwitch() {
    if (masterCurrentSwitch)
      return (
        <Typography component="div">Current Group: 
        <Switch color="secondary" checked={myCurrentSwitch} name="adminSw" inputProps={{ 'aria-label': 'primary checkbox' }}/>
        </Typography>
      )
    else
      return (
          <Typography component="div">Set Current : 
          <Switch color="primary" checked={myCurrentSwitch} onChange={handleCurrent} name="adminSw" inputProps={{ 'aria-label': 'primary checkbox' }}/>
          </Typography>
      )
  }

  function handleDefault() {
    setMyDefaultSwitch(!myDefaultSwitch);
  }

  function DefaultSwitch() {
    if (masterDefaultSwitch)
      return (
          <Typography component="div">Default Group : 
          <Switch color="secondary" checked={myDefaultSwitch} name="adminSw" inputProps={{ 'aria-label': 'primary checkbox' }}/>
          </Typography>
      )
  else 
    return (
        <Typography component="div">Set Default : 
        <Switch color="primary" checked={myDefaultSwitch} onChange={handleDefault} name="adminSw" inputProps={{ 'aria-label': 'primary checkbox' }}/>
        </Typography>
    )
}

  function DisplaySwitch() {
    return (
      <div>
        <AdminSwitch />
        <CurrentSwitch />
        <DefaultSwitch />
      </div>
    )
  }

  function ShowGroupMembers() {
    // var grpName = localStorage.getItem("groupName");
    // var ggg = myGroupTableData.find(x=> x.groupName === grpName);
    // console.log(ggg);
    // window.localStorage.setItem("gdGid", ggg.gid.toString());
    // window.localStorage.setItem("gdName", ggg.groupName)
    // window.localStorage.setItem("gdAdmin", ggg.admin.toString());
    // console.log("abou to call /admin/membergroup ")
    history.push("/admin/membergroup");        
};

  function DisplayButtons() {
    return (
    <div>
      <Button variant="contained" color="primary" className={classes.button}
        type="submit">
        Update
      </Button>
      <Button key={"members"} variant="contained" color="primary"
            className={classes.button} onClick={ShowGroupMembers}>Members
      </Button>
      <Button variant="contained" color="primary" className={classes.button}
          onClick={() => {history.push('/admin/mygroup')}}
          type="cancel">
        Done
      </Button>
      <Route  path='/admin/membergroup' component={GroupMember} key="MemberList"/>
      </div>
    );
  }

  function DisplayHeader() {
    return (
      <div>
        <Typography component="h1" variant="h5">Group Details</Typography>
        <Typography className={classes.groupName} align="center">({myGroupName})</Typography>
      </div>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <DisplayHeader/>
        <BlankArea/>
    <ValidatorForm className={classes.form} onSubmit={handleSubmit}>
      {/* <TextValidator
          variant="outlined"
          fullWidth      
          label="Group Name (Read-Only)"
          readOnly
          value={myGroupName}
        />
      <BlankArea/> */}
      <TextValidator
          variant="outlined"
        //   required
          fullWidth      
          label="Franchise Name"
          onChange={(event) => setDisplayName(event.target.value)}
          name="displayname"
          validators={['noSpecialCharacters']}
          errorMessages={['Special characters not permitted']}
          value={myDisplayName}
      />
      <BlankArea/>
      <DisplaySwitch/>
      <BlankArea/>
      <ShowResisterStatus/>
      <DisplayButtons/>
    </ValidatorForm>
    </div>
    <ChildComp />    
    </Container>
  );
}
