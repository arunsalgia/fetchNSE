import React, { useState, useContext ,useEffect} from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';

import Link from '@material-ui/core/Link';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';

import SignUp from "../SignUp/SignUp.js";
import { useHistory } from "react-router-dom";

import { UserContext } from "../../UserContext";
import axios from "axios";


function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {'Copyright © '}
      <Link color="inherit" >
        Your Website
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

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
}));

const handleSubmit = e => {
  e.preventDefault();
};
export default function SignIn() {
  const classes = useStyles();
  const history = useHistory();
  const [userName, setUserName] = useState();
  const [password, setPassword] = useState();
const [showPage,setShowPage]=useState(false);
  const { setUser } = useContext(UserContext);

  useEffect(()=>{
    if(localStorage.getItem("uid")){
      setUser({uid:localStorage.getItem("uid"),admin:localStorage.getItem("admin")})
      history.push("/admin")
    }else{
      setShowPage(true)
    }
  })
  const handleClick = async () => {
    const response = await axios.get(`/user/login/${userName}/${password}`);

    if (response.status === 200) {

      localStorage.setItem("uid", response.data)

      const admin = await axios.get(`/group/owner`);
      if (admin.data.uid === response.data) {
        localStorage.setItem("admin", true)
        setUser({ uid: response.data, admin: true });
      } else {
        setUser({ uid: response.data, admin: false });
        localStorage.setItem("admin", false)
      }
      history.push("/admin")

    }

  }
  return (
    showPage?
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <Avatar className={classes.avatar}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <form className={classes.form} onSubmit={handleSubmit} noValidate>
          <TextField
            autoComplete="fname"
            name="userName"
            variant="outlined"
            required
            fullWidth
            id="userName"
            label="User Name"
            autoFocus
            onChange={(event) => setUserName(event.target.value)}

          />
          <TextField
            variant="outlined"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
          />



          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
            onClick={handleClick}
          >
            Sign In
          </Button>

        </form>
      </div>

    </Container>:""
  );
}
