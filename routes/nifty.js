const { default: axios } = require('axios');
//const { getISTtime, nseWorkingTime } = require('./niftyfunctions'); 
var router = express.Router();
let NiftyRes;
// const NSE_NIFTY = {"_id":"5fd88d6688e28d0c64ecd6d0","nid":2,"niftyName":"NIFTY","niftyCode":-10006,"__v":0};

/* GET users listing. */
router.use('/', function(req, res, next) {
  NiftyRes = res;
  setHeader();
  if (!db_connection) { senderr(DBERROR, ERR_NODB); return; }
  next('route');
});


router.get('/additem/:name/:code', async function (req, res, next) {
  NiftyRes = res;
  setHeader();

  var { name, code } = req.params;

  let niftyRec = await NiftyNames.findOne({niftyName: name});
  if (niftyRec) { senderr(601, `Nifty ${name} already configured`); return; }
  
  let nRec = await NiftyNames.find().limit(1).sort({ "nid": -1 });
  let newNid = 0
  if (nRec.length > 0) newNid = nRec[0].nid;
  ++newNid;
  // console.log(nRec);
  niftyRec = new NiftyNames({
    nid: newNid,
    niftyName: name,
    niftyCode: code,
    enable: true,
  });
  niftyRec.save();
  sendok("ok");
}); 


router.get('/list', async function (req, res, next) {
  NiftyRes = res;
  setHeader();
  let allNiftyRec = await NiftyNames.find({enable: true});
  sendok(allNiftyRec);
}); 

router.get('/test/:timevalue', async function (req, res, next) {
  NiftyRes = res;
  setHeader();
  var { timevalue } = req.params;
  let myDate = new Date(parseInt(timevalue));
  // myDate.setTime(myDate);
  // console.log(finalDate);
  sendok(myDate);
});

router.get('/getnsedata/:nseName/:expiryDate/:myRange', async function (req, res, next) {
  NiftyRes = res;
  setHeader();
  let {nseName, expiryDate} = req.params;

  let myRange = DEFAULTRANGE;

  let nameRec = await NiftyNames.findOne({niftyName: nseName, enable: true});
  if (!nameRec) {
    senderr(601, "Invalid NSE name");
    return;
  }
  let latestData = await read_nse_data(nameRec);
  latestData.niftyData = _.filter(latestData.niftyData, x => x.expiryDate === expiryDate);
  sendok({dispString: latestData.dispString, niftyData: latestData.niftyData});
}); 

router.get('/getexpirydate/:nseName', async function (req, res, next) {
  NiftyRes = res;
  setHeader();
  let {nseName} = req.params;

  let tmp = await ExpiryDate.find({nseName: nseName}).limit(1).sort({ "time": -1 });
  // console.log(tmp);
  let myData = await ExpiryDate.find({nseName: nseName, time: tmp[0].time }).sort({"revDate": 1});
  // console.log(myData);
  sendok(myData);
}); 

router.get('/holiday/:myYear', async function (req, res, next) {
  NiftyRes = res;
  setHeader();
  let {myYear} = req.params;

  publishHolidays(myYear);
}); 

router.get('/currentyearholiday', async function (req, res, next) {
  NiftyRes = res;
  setHeader();

  // provide list of holidays for current year
  let tmp = new Date();
  publishHolidays(tmp.getFullYear());
}); 

async function publishHolidays(year) {
  let myData = await Holiday.find({year: year});
  myData = _.sortBy(myData, x => x.yearMonthDay);
  sendok(myData);
}

const nonNiftyUrl = `https://www1.nseindia.com/live_market/dynaContent/live_watch/option_chain/optionKeys.jsp?symbolCode={niftyCode}&symbol={niftyName}&symbol={niftyName}&instrument=OPTSTK&date=-&segmentLink=17&segmentLink=17`
// const niftyUrl = `https://www1.nseindia.com/live_market/dynaContent/live_watch/option_chain/optionKeys.jsp?symbolCode=-10006&symbol=NIFTY&symbol=NIFTY&instrument=-&date=-&segmentLink=17&symbolCount=2&segmentLink=17`;
// / Equivalent to `axios.get('https://httpbin.org/get?answer=42')`
// const res = await axios.get('https://httpbin.org/get', { params: { answer: 42 } });


function get_nseindia_URL(nRec)
{ 
  // console.log(nRec);
  
  // let myUrl = "'https://www.nseindia.com/api/option-chain-indices', { params: { symbol: 'NIFTY' } }"
  return myUrl;
}


async function noproxy_axiosNiftyData(iREC) {
  // first get the url string to get data
  let myUrl = get_nseindia_URL(iREC);
  console.log(myUrl);
  try {
    console.log(`AXIOS call ${myUrl}`)
    //let niftyres = await axios.get(myUrl);
    let niftyres = await axios.get('https://www.nseindia.com/api/option-chain-indices', { params: { symbol: 'NIFTY' } });
    console.log("git nse data from site using AXIOS")
    return {sts: true, data: niftyres.data};
  } catch (error) {
    console.log("error from site using AXIOS")
    console.log(error);
    return {sts: false, data: []};
  }   
    // if (error.response) {
    // else
    //   console.log("NO response")
  }
  // console.log(err)
 


async function fetch_axiosNiftyData(iREC) {
  // first get the url string to get data
  let myUrl = get_nseindia_URL(iREC);
  console.log(myUrl);
  let settings = { method: "Get" };

res = await fetch(myUrl);
console.log(res);
return {sts: true, data: json};
}


async function readalldata() {
  let allNiftyRec = await NiftyNames.find({enable: true});
  for(nRec of allNiftyRec) {
    console.log(`Receiving data of ${nRec.niftyName}`)
    let myData = await read_nse_data(nRec);
	if (myData == undefined) continue;
	console.log("populate data");
    myData.niftyData.forEach(x => {
      x.save();
    })
  
    //console.log(myData.expiryData);
    myData.expiryData.forEach( x => {
      x.save();
    })
    console.log(`Receiving ended of ${nRec.niftyName}`)
  }
}

async function processConnection(i) {
  // just simple connection then nothing to do
  // console.log("in process connection array");
  // console.log(connectionArray[i]);
  if ((connectionArray[i].uid  <= 0)  ||
      (connectionArray[i].page.length  <= 0)) return;

  console.log(connectionArray[i].page)
  var myDate1 = new Date();
  var myData;
  if (connectionArray[i].page === "NSEDATA") {
    myData = _.find(nseData, x => x.stockName === connectionArray[i].stockName);
    if (!myData) {
      let nameRec = await NiftyNames.findOne({niftyName: connectionArray[i].stockName, enable: true});
      if (nameRec) {
        console.log("Got nifty rec. Calling NSE DATA");
        let latestData = await read_nse_data(nameRec);
        if (latestData)
            myData = {stockName: connectionArray[i].stockName, stockData: latestData.niftyData, dispString: latestData.dispString, underlyingValue: latestData.underlyingValue }
        console.log("got dtata")
        // console.log(myData);
      } 
    }

    if (myData) {
      io.to(connectionArray[i].socketId).emit('NSEUNDERLYINGVALUE', myData.underlyingValue);
      io.to(connectionArray[i].socketId).emit('NSEDISPLAYSTRING', myData.dispString);

      let tmp = _.filter(myData.stockData, x => x.expiryDate === connectionArray[i].expiryDate);
      let minSP = myData.underlyingValue - connectionArray[i].margin;
      let maxSP = myData.underlyingValue + connectionArray[i].margin;
      console.log(`${minSP}  ${maxSP}`);
      tmp = _.filter(tmp, x => x.strikePrice >= minSP && x.strikePrice <= maxSP);
      io.to(connectionArray[i].socketId).emit('NSEDATA', tmp);
      // io.to(connectionArray[i].socketId).emit('rank', myData.dbData.rank);
      console.log("sent NSE data to " + connectionArray[i].socketId);``
    }

  } else {

  }

  return;

  // console.log(clientData);
  var myData = _.find(clientData, x => x.tournament === myTournament);
  let sts = false;
  if (!myData) {
    // no data of this tournament with us. Read database and do calculation
    // console.log("------------------reading database");
    sts = await readDatabase(connectionArray[i].gid );
    // console.log(`Status is ${sts} for tournamenet data ${myTournament}`);
    if (sts) {
      // console.log(connectionArray[i].gid );
      let myDB_Data = await statCalculation(connectionArray[i].gid );
      let mySTAT_Data = await statBrief(connectionArray[i].gid , 0 , SENDSOCKET);
      myData = {tournament: myTournament, dbData: myDB_Data, statData: mySTAT_Data}
      clientData.push(myData);
      var myDate2 = new Date();
      var duration = myDate2.getTime() - myDate1.getTime();
      console.log(`Total calculation Time: ${duration}`)
    }
  }
  // else
  //   console.log("----- data already availanle");
  // console.log(clientData);
  // console.log(`Will send data of ${myData.tournament} to UID ${connectionArray[i].uid}  with GID ${connectionArray[i].gid}`);
  // console.log(connectionArray[i].page);
  switch(connectionArray[i].page.substr(0, 4).toUpperCase()) {
    case "DASH":
      if (myData) {
        io.to(connectionArray[i].socketId).emit('maxRun', myData.dbData.maxRun);
        io.to(connectionArray[i].socketId).emit('maxWicket', myData.dbData.maxWicket);
        io.to(connectionArray[i].socketId).emit('rank', myData.dbData.rank);
        console.log("sent Dash data to " + connectionArray[i].socketId);
      }
      break;
    case "STAT":
      if (myData) {
          io.to(connectionArray[i].socketId).emit('brief', myData.statData);
          console.log("Sent Stat data to " + connectionArray[i].socketId);
      }
      break
    // case "AUCT":
    //   console.log(auctioData);
    //   var myRec = _.filter(auctioData, x => x.gid == connectionArray[i].gid);
    //   console.log(myRec);
    //   if (myRec.length > 0) {
    //     io.to(connectionArray[i].socketId).emit('playerChange', 
    //         myRec[0].player, myRec[0].balance );
    //       console.log("Sent Auction data to " + connectionArray[i].socketId);          
    //   }
    //   break;
  }

  return;
}

async function sendClientData() {
  let T1 = new Date();
  console.log("---------------------");
  connectionArray = [].concat(masterConnectionArray)
  nseData = [];
  for(i=0; i<connectionArray.length; ++i)  {
    await processConnection(i);
  }
  let T2 = new Date();
  let diff = T2.getTime() - T1.getTime();
  // console.log(T1);
  // console.log(T2);
  console.log(`Processing all socket took time ${diff}`);
}


function sendok(usrmsg) { NiftyRes.send(usrmsg); }
function senderr(errcode, errmsg) { NiftyRes.status(errcode).send(errmsg); }
function setHeader() {
  NiftyRes.header("Access-Control-Allow-Origin", "*");
  NiftyRes.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
}

module.exports = router;
