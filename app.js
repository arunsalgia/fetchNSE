express = require('express');
path = require('path');
cookieParser = require('cookie-parser');
logger = require('morgan');
mongoose = require("mongoose");
cors = require('cors');
fetch = require('node-fetch');
_ = require("lodash");
cron = require('node-cron');
axios = require('axios');
const { promisify } = require('util')
sleep = promisify(setTimeout)
const {
  getLoginName, getDisplayName, cricDate,
  encrypt, decrypt, dbencrypt, dbdecrypt,
	dbToSvrText, svrToDbText,
	sendCricMail,
  userAlive,
  getBlankNSEDataRec, getBlankCurrNSEDataRec,
  revDate, datePriceKey,
  getISTtime, nseWorkingTime,
} = require('./niftyfunctions'); 


app = express();
PRODUCTION=false;

PORT = process.env.PORT || 1961;
http = require('http');
httpServer = http.createServer(app);

nseRetry=5   // retry count 
nseSleep=1000 // sleep for 1 second and try to fetch data from NSE if error while getching
READNSEINTERVAL=60;    
UPDATENSEINTERVAL=15; // 900 seconds in 15 minues
readTimer = 0;
updateTimer = 0;

app.set('view engine', 'html');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'material-dashboard-react-master/build/')));
app.use(express.json());

// ---- start of globals

//Schema
MasterSettingsSchema = mongoose.Schema ({
  msid: Number,
  trialExpiry: String,
})

UserSchema = mongoose.Schema({
  uid: Number,
  userName: String,
  displayName: String,
  password: String,
  status: Boolean,
  //defaultGroup: Number,
  email: String,
  userPlan: Number
});

NiftySchema = mongoose.Schema({
  nid: Number,
  niftyName: String,
  niftyCode: Number,
  enable: Boolean,
});

NSEDataSchema = mongoose.Schema({
  nseName: String,
  expiryDate: String,
  strikePrice: Number,
  time: Number, 
  underlyingValue: Number,
  pe_openInterest: Number,
  pe_changeinOpenInterest: Number,
  pe_totalTradedVolume: Number,
  pe_impliedVolatility: Number,
  pe_lastPrice: Number,
  pe_pChange: Number,
  pe_bidQty: Number,
  pe_bidprice: Number,
  pe_askQty: Number,
  pe_askPrice: Number,
  ce_openInterest: Number,
  ce_changeinOpenInterest: Number,
  ce_totalTradedVolume: Number,
  ce_impliedVolatility: Number,
  ce_lastPrice: Number,
  ce_pChange: Number,
  ce_bidQty: Number,
  ce_bidprice: Number,
  ce_askQty: Number,
  ce_askPrice: Number,
});


ExpiryDateSchema = mongoose.Schema({
  nseName: String,
  expiryDate: String,
  revDate: String,
  time: Number,
  timestamp: String,
  underlyingValue: String,
});

HolidaySchema = mongoose.Schema({
  name: String,
  day: Number,
  month: Number,
  year: Number, 
  yearMonthDay: String, /// string in YYYYMMDD format. It can be used for sorting
});

// models
MasterData = mongoose.model("MasterSettings", MasterSettingsSchema)
User = mongoose.model("users", UserSchema);
NiftyNames = mongoose.model("niftynames", NiftySchema);
Holiday = mongoose.model("holiday", HolidaySchema)
// for historical
NSEData = mongoose.model("nse_data", NSEDataSchema);
ExpiryDate = mongoose.model("expirydate", ExpiryDateSchema)
// for current display
CurrNSEData = mongoose.model("curr_nse_data", NSEDataSchema);
CurrExpiryDate = mongoose.model("curr_expirydate", ExpiryDateSchema)


//router = express.Router();

db_connection = false;      // status of mongoose connection
connectRequest = true;

// Error messages
DBERROR = 990;
DBFETCHERR = 991;
CRICFETCHERR = 992;
ERR_NODB = "No connection to NSE database";

// ----------------  end of globals

// make mogoose connection

// connection string for database
mongoose_conn_string = "mongodb+srv://ArpanaSalgia:Arpana%4001@niftydata.alj4u.mongodb.net/NIFTY?authSource=admin&replicaSet=atlas-kvq10m-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true"

// Create the database connection 
mongoose.connect(mongoose_conn_string, { useNewUrlParser: true, useUnifiedTopology: true });

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function () {
  console.log('Mongoose default connection open to ' + mongoose_conn_string);
  db_connection = true;
  connectRequest = true;
});

// If the connection throws an error
mongoose.connection.on('error', function (err) {
  console.log('Mongoose default connection error');
  console.log(err);
  db_connection = false;
  connectRequest = false;   // connect request refused
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
  console.log('Mongoose default connection disconnected');
  db_connection = false;
});

// If the Node process ends, close the Mongoose connection 
process.on('SIGINT', function () {
  // close mongoose connection
  mongoose.connection.close(function () {
    console.log('Mongoose default connection disconnected through app termination');
  });
  process.exit(0);
});

// schedule task
cron.schedule('*/15 * * * * *', () => {
  if (!connectRequest)
    mongoose.connect(mongoose_conn_string, { useNewUrlParser: true, useUnifiedTopology: true });
});



// start app to listen on specified port
httpServer.listen(PORT, () => {
  console.log("Server is running on Port: " + PORT);
});


// schedule task
let firstTime = true;
cron.schedule('*/1 * * * * *', async () => {
  // check mongoose connection
  if (!db_connection) {
    console.log("============= No mongoose connection");
    firstTime = true;
    return;
  }   
  // is it time to read data
  if (++readTimer > READNSEINTERVAL) {
    console.log(`-----------------------Start of schedule`);
    readTimer = 0;
    let writeToDb = false;
    if (++updateTimer > UPDATENSEINTERVAL) {
      writeToDb = true;
      updateTimer = 0;
    }
    console.log(`======== nse stock update start. DBWRITE: ${writeToDb}`);
    // if NSE is working then get data
    let sts = await nseWorkingTime();
    //sts = true;  //---------------------- for testing
    //console.log(`NEW Working time: ${sts}`)
    if (sts) {
      let allNiftyRec = await NiftyNames.find({enable: true});
      for(nRec of allNiftyRec) {
        console.log(`Receiving data of ${nRec.niftyName}`)
        let myData = await read_nse_data(nRec);
        if (myData) {
          console.log("populate data");
          // now save as current
          console.log(nRec.niftyName);
          await CurrExpiryDate.deleteMany({nseName: nRec.niftyName });
           myData.currExpiryData.forEach( x => {  x.save(); });
          await CurrNSEData.deleteMany({nseName: nRec.niftyName });
          console.log(myData.currNiftyData.length)
          myData.currNiftyData.forEach(x => { x.save(); });

          // if write to db then write to DB
          if (writeToDb) {
            myData.niftyData.forEach(x => {x.save();});
            myData.expiryData.forEach( x => { x.save() });
          }
        } 
      }
    }
    console.log(`---------------------------- end of schedule`);
  }
});


async function read_nse_data(myNiftyRec) {
  var dataFromNSEapi = await fetchNiftyData(myNiftyRec);
  console.log("just callled fetch");
  console.log(dataFromNSEapi);
  if (dataFromNSEapi === undefined) {return;};

  // has data. Now process data
  // dataFromNSEapi.records.expiryDates = ["17-Dec-2020","24-Dec-2020","31-Dec-2020","07-Jan-2021","14-Jan-2021","21-Jan-2021","28-Jan-2021","04-Feb-2021","11-Feb-2021","25-Feb-2021","25-Mar-2021","24-Jun-2021","30-Sep-2021","30-Dec-2021","30-Jun-2022","29-Dec-2022","29-Jun-2023","28-Dec-2023","27-Jun-2024","26-Dec-2024","26-Jun-2025"]
  let currtime = new Date().getTime();
  let myData = dataFromNSEapi.records.data;
  // let myData = dataFromNSEapi.filtered.data;
  let niftyData = [];
  let expiryData = [];
  let cNiftyData = [];
  let cExpiryData = [];
  let eRec;

  myData.forEach(rec => {
    // first find if entry of date is there
    // let myKey = datePriceKey(rec.expiryDate, rec.strikePrice);
    eRec = _.find(expiryData, x => x.expiryDate === rec.expiryDate);
    if (!eRec) {
      eRec = new ExpiryDate({
        nseName: myNiftyRec.niftyName,
        expiryDate: rec.expiryDate,
        revDate: revDate(rec.expiryDate),
        time: currtime,
        timestamp: dataFromNSEapi.records.timestamp,
        underlyingValue: dataFromNSEapi.records.underlyingValue,
      });
      expiryData.push(eRec);
    }
    eRec = _.find(cExpiryData, x => x.expiryDate === rec.expiryDate);
    if (!eRec) {
      eRec = new CurrExpiryDate({
        nseName: myNiftyRec.niftyName,
        expiryDate: rec.expiryDate,
        revDate: revDate(rec.expiryDate),
        time: currtime,
        timestamp: dataFromNSEapi.records.timestamp,
        underlyingValue: dataFromNSEapi.records.underlyingValue,
      });
      cExpiryData.push(eRec);
    }

    let myRec = _.find(niftyData, x => x.expiryDate === rec.expiryDate && x.strikePrice == rec.strikePrice);
    if (!myRec) {
      myRec = getBlankNSEDataRec();
      myRec.nseName = myNiftyRec.niftyName;
      myRec.expiryDate = rec.expiryDate;
      myRec.strikePrice = rec.strikePrice;
      myRec.time = currtime;
      niftyData.push(myRec);
    }
    if (rec.PE !== undefined) add_pe_data(myRec, rec.PE);
    if (rec.CE !== undefined) add_ce_data(myRec, rec.CE);

    myRec = _.find(cNiftyData, x => x.expiryDate === rec.expiryDate && x.strikePrice == rec.strikePrice);
    if (!myRec) {
      myRec = getBlankCurrNSEDataRec();
      myRec.nseName = myNiftyRec.niftyName;
      myRec.expiryDate = rec.expiryDate;
      myRec.strikePrice = rec.strikePrice;
      myRec.time = currtime;
      cNiftyData.push(myRec);
    }
    if (rec.PE !== undefined) add_pe_data(myRec, rec.PE);
    if (rec.CE !== undefined) add_ce_data(myRec, rec.CE);
  });

  //Underlying Index: NIFTY 13711.50  As on Dec 18, 2020 12:32:23 IST 
  // as received from nSE 18-Dec-2020 12:32:53
  let nameTimeStr = `Underlying Index:  ${myNiftyRec.niftyName} ${dataFromNSEapi.records.underlyingValue} As on ${dataFromNSEapi.records.timestamp} IST`
  return {dispString: nameTimeStr, 
    niftyData: niftyData, expiryData: expiryData, 
    currNiftyData: cNiftyData, currExpiryData: cExpiryData, 
    underlyingValue: dataFromNSEapi.records.underlyingValue};
}



const niftyUrl_prefix = "https://www.nseindia.com/api/option-chain-indices?symbol=";
const niftyUrl_postfix = "";
async function readAxios(iREC) {
  // first get the url string to get data
  let myUrl = niftyUrl_prefix + iREC.niftyName + niftyUrl_postfix;
  //console.log(`AXIOS call------- ${myUrl}`);
  try {
    let niftyres = await axios.get(myUrl);
    return {sts: true, data: niftyres.data};
  } catch (error) {
    console.log("error from site using AXIOS")
    return {sts: false, data: []};
  }
}

async function fetchNiftyData(iREC) {
  let retryCount = nseRetry;
  while (retryCount > 0) {
    console.log(retryCount);
    let xxx = await readAxios(iREC);
    console.log(`Status is ${xxx.sts}`);
    if (xxx.sts) return (xxx.data);
    console.log("about to sleep");
    --retryCount;
    await sleep(nseSleep);
  }
  return;
}


function add_pe_data(record, PE) {
  // console.log(record);
  record["pe_openInterest"] = PE.openInterest;
  record["pe_changeinOpenInterest"] = PE.changeinOpenInterest;
  record["pe_totalTradedVolume"] = PE.totalTradedVolume;
  record["pe_impliedVolatility"] = PE.impliedVolatility;
  record["pe_lastPrice"] = PE.lastPrice;
  record["pe_pChange"] = PE.pChange;
  record["pe_bidQty"] = PE.bidQty;
  record["pe_bidprice"] = PE.bidprice;
  record['pe_askQty'] = PE.askQty;
  record["pe_askPrice"] = PE.askPrice;
}

function add_ce_data(record, CE) {
  // console.log(CE);
  record["ce_openInterest"] = CE.openInterest;
  record["ce_changeinOpenInterest"] = CE.changeinOpenInterest;
  record["ce_totalTradedVolume"] = CE.totalTradedVolume;
  record["ce_impliedVolatility"] = CE.impliedVolatility;
  record["ce_lastPrice"] = CE.lastPrice;
  record["ce_pChange"] = CE.pChange;
  record["ce_bidQty"] = CE.bidQty;
  record["ce_bidprice"] = CE.bidprice;
  record['ce_askQty'] = CE.askQty;
  record["ce_askPrice"] = CE.askPrice;
}
