const algorithm = 'aes-256-ctr';
const akshusecretKey = 'TihomHahs@UhskaHahs#19941995Bona';
const ankitsecretKey = 'Tikna@Itark#1989#1993Bonaventure';

const iv = '05bd9fbf50b124cd2bad8f31ca1e9ca4';           //crypto.randomBytes(16);
//zTvzr3p67VC61jmV54rIYu1545x4TlY

const encrypt = (text) => {

    //console.log(`Text is ${text}`);
    const cipher = crypto.createCipheriv(algorithm, akshusecretKey, Buffer.from(iv, 'hex'));	
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    //myIv = iv.toString('hex');

    return encrypted.toString('hex');
};

const decrypt = (hash) => {

    const decipher = crypto.createDecipheriv(algorithm, akshusecretKey, Buffer.from(iv, 'hex'));
    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash, 'hex')), decipher.final()]);
    return decrpyted.toString();
};

const dbencrypt = (text) => {

    //console.log(`Text is ${text}`);
    const cipher = crypto.createCipheriv(algorithm, ankitsecretKey, Buffer.from(iv, 'hex'));
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    //myIv = iv.toString('hex');

    return encrypted.toString('hex');
};

const dbdecrypt = (hash) => {

    const decipher = crypto.createDecipheriv(algorithm, ankitsecretKey, Buffer.from(iv, 'hex'));
    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash, 'hex')), decipher.final()]);
    return decrpyted.toString();
};

const getLoginName = (name) => {
    return name.toLowerCase().replace(/\s/g, "");
  }
  
const getDisplayName = (name) => {
    var xxx = name.split(" ");
    xxx.forEach( x => { 
      x = x.trim()
      x = x.substr(0,1).toUpperCase() +
        (x.length > 1) ? x.substr(1, x.length-1).toLowerCase() : "";
    });
    return xxx.join(" ");
  }

const svrToDbText = (text) => {
	// first decrypt text sent by server
    let xxx = decrypt(text);
	// now encrypt this for database
	xxx = dbencrypt(xxx);
    return xxx;
  }

const dbToSvrText = (text) => {
	// first decrypt text of database
    let xxx = dbdecryptdecrypt(text);
	// now encrypt this for server
	xxx = encrypt(xxx);
    return xxx;
  }

async function sendCricMail (dest, mailSubject, mailText) {

  //console.log(`Destination is ${dest}`);
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: APLEMAILID,
      pass: 'Anob@1989#93'
    }
  });

  var mailOptions = {
    from: APLEMAILID,
    to: '',
    subject: '',
    text: ''
  };

  console.log("About to start");
  mailOptions.to = dest;
  mailOptions.subject = mailSubject;
  mailOptions.text = mailText;

  console.log(mailOptions.to);
  console.log(mailOptions.subject);
  console.log(mailOptions.text.length);
  console.log(`About to send email`);
  try {
    let response = await transporter.sendMail(mailOptions);
    //console.log(response);
    return ({status: true, error: 'Email Successfully sent'});
  } catch (e) {
    console.log("error sending email");
    console.log(e);
    return ({status: false, error: 'error sending Email'});
  }
  // how to handle error. don't know may be use try/catch 
  /***
  transporter.sendMail(mailOptions, function(error, info){
	console.log('insertBefore');
    if (error) {
      console.log(error);
	  return ({status: false, error: error});
      //senderr(603, error);
    } else {
      console.log('Email sent: ' + info.response);
	  return ({status: true, error: info.response});
      //sendok('Email sent: ' + info.response);
    }
  });
  console.log('udi baba');
  ***/
} 

  
const TZ_IST={hours: 5, minutes: 30};

function getISTtime() {
  let currDate = new Date();
  // on production server. current time is GST. Need to add IST time zone for calculation
  if (PRODUCTION) {
    currDate.setHours(currDate.getHours()+TZ_IST.hours);
    currDate.setMinutes(currDate.getMinutes()+TZ_IST.minutes);
  }
  return currDate
}  

WEEKEND = [0, 6]       // (SUN=0 and SAT=6 is weekend)
STARTTIME = {hours: 9, minutes: 15}
ENDTIME = {hours: 15, minutes: 30}

let prevday = 0;
let todayIsHoliday = false;

async function nseWorkingTime() {
 
  let currDate = getISTtime();

  let today = currDate.getDate();
  let currHour = currDate.getHours();
  let currMinute = currDate.getMinutes();
  console.log(`Curr Time: ${currHour}:${currMinute}`);
  //if (!PRODUCTION) return true;

  // if there is change of date then check if today it is holiday
  if (today !== prevday) {
    let tmp = await Holiday.findOne({
      day: today, 
      month: (currDate.getMonth()+1), 
      year: currDate.getFullYear()
    });
    todayIsHoliday = (tmp !== null);
    prevday = today;
  }

  if (todayIsHoliday) return false;
  // console.log("Not holiday")
  
  // check if it is weekend
  if (WEEKEND.includes(currDate.getDay()))  // if week end
    return false;

  // working day thus cehck if time is in range i.e. is it is working hour of NSE

  if (currHour < STARTTIME.hours) 
    return false;
  if (currHour > ENDTIME.hours)
    return false;
  if ((currHour === STARTTIME.hours) && (currMinute < STARTTIME.minutes))
    return false;
  if ((currHour === ENDTIME.hours) && (currMinute > ENDTIME.minutes))
    return false;

  console.log("Working time");
  return true;
}

function getBlankNSEDataRec() {
  let myblankRec = new NSEData();
  myblankRec.nseName = "";
  myblankRec.expiryDate = "";
  myblankRec.strikePrice = 0;
  myblankRec.time = 0;
  myblankRec.underlyingValue = 0;
  myblankRec.pe_openInterest = 0;
  myblankRec.pe_changeinOpenInterest = 0;
  myblankRec.pe_totalTradedVolume = 0;
  myblankRec.pe_impliedVolatility = 0;
  myblankRec.pe_lastPrice = 0;
  myblankRec.pe_pChange = 0;
  myblankRec.pe_bidQty = 0;
  myblankRec.pe_bidprice = 0;
  myblankRec.pe_askQty = 0;
  myblankRec.pe_askPrice = 0;
  myblankRec.ce_openInterest = 0;
  myblankRec.ce_changeinOpenInterest = 0;
  myblankRec.ce_totalTradedVolume = 0;
  myblankRec.ce_impliedVolatility = 0;
  myblankRec.ce_lastPrice = 0;
  myblankRec.ce_pChange = 0;
  myblankRec.ce_bidQty = 0;
  myblankRec.ce_bidprice = 0;
  myblankRec.ce_askQty = 0;
  myblankRec.ce_askPrice = 0;
  // console.log(myblankRec);
  return myblankRec;

}

function getBlankNSEDataRec() {
  let myblankRec = new NSEData();
  myblankRec.nseName = "";
  myblankRec.expiryDate = "";
  myblankRec.strikePrice = 0;
  myblankRec.time = 0;
  myblankRec.underlyingValue = 0;
  myblankRec.pe_openInterest = 0;
  myblankRec.pe_changeinOpenInterest = 0;
  myblankRec.pe_totalTradedVolume = 0;
  myblankRec.pe_impliedVolatility = 0;
  myblankRec.pe_lastPrice = 0;
  myblankRec.pe_pChange = 0;
  myblankRec.pe_bidQty = 0;
  myblankRec.pe_bidprice = 0;
  myblankRec.pe_askQty = 0;
  myblankRec.pe_askPrice = 0;
  myblankRec.ce_openInterest = 0;
  myblankRec.ce_changeinOpenInterest = 0;
  myblankRec.ce_totalTradedVolume = 0;
  myblankRec.ce_impliedVolatility = 0;
  myblankRec.ce_lastPrice = 0;
  myblankRec.ce_pChange = 0;
  myblankRec.ce_bidQty = 0;
  myblankRec.ce_bidprice = 0;
  myblankRec.ce_askQty = 0;
  myblankRec.ce_askPrice = 0;
  return myblankRec;
}

function getBlankCurrNSEDataRec() {
  //console.log("Blank NSE Data");
  let myblankRec = new CurrNSEData();
  myblankRec.nseName = "";
  myblankRec.expiryDate = "";
  myblankRec.strikePrice = 0;
  myblankRec.time = 0;
  myblankRec.underlyingValue = 0;
  myblankRec.pe_openInterest = 0;
  myblankRec.pe_changeinOpenInterest = 0;
  myblankRec.pe_totalTradedVolume = 0;
  myblankRec.pe_impliedVolatility = 0;
  myblankRec.pe_lastPrice = 0;
  myblankRec.pe_pChange = 0;
  myblankRec.pe_bidQty = 0;
  myblankRec.pe_bidprice = 0;
  myblankRec.pe_askQty = 0;
  myblankRec.pe_askPrice = 0;
  myblankRec.ce_openInterest = 0;
  myblankRec.ce_changeinOpenInterest = 0;
  myblankRec.ce_totalTradedVolume = 0;
  myblankRec.ce_impliedVolatility = 0;
  myblankRec.ce_lastPrice = 0;
  myblankRec.ce_pChange = 0;
  myblankRec.ce_bidQty = 0;
  myblankRec.ce_bidprice = 0;
  myblankRec.ce_askQty = 0;
  myblankRec.ce_askPrice = 0;
  return myblankRec;
}

function revDate(myDate) {
  let xxx = myDate.split('-');
  let myIdx = SHORTMONTHNAME.indexOf(xxx[1].substr(0,3).toUpperCase()).toString();
  if (myIdx.length === 1) myIdx = "0" + myIdx;
  return(xxx[2]+myIdx+xxx[0]);
}

const zerostr = "000000";
function datePriceKey(myDate, strikePrice) {
  let p1 = revDate(myDate);
  let p3 = strikePrice.toString();
  let p2 = (p3.length < 5) ? zerostr.substr(0, 5-p3.length) : "";
  return(`${p1}-${p2}${p3}`)
}

async function userAlive(uRec) {
  let sts = false;
  if (uRec) {
    switch (uRec.userPlan) {
      case USERTYPE.SUPERUSER:
        sts = true;
        break;
      case  USERTYPE.PAID:
        sts = true;
        break;
      case  USERTYPE.TRIAL:
        let cTime = new Date();
        await fetchMasterSettings(); 
        // console.log(masterRec);
        let tTime = new Date(masterRec.trialExpiry);
        // console.log(cTime);
        // console.log(tTime);
        sts =  (tTime.getTime() > cTime.getTime());
        break;
    }
  }
  return sts;
}

// date time constants

minutesIST = 330;    // IST time zone in minutes 330 i.e. GMT+5:30
minutesDay = 1440;   // minutes in a day 24*60 = 1440

const AMPM = [
  "AM", "AM", "AM", "AM", "AM", "AM", "AM", "AM", "AM", "AM", "AM", "AM",
  "PM", "PM", "PM", "PM", "PM", "PM", "PM", "PM", "PM", "PM", "PM", "PM"
];

SHORTMONTHNAME = ['', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
MONTHNAME = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
weekDays = new Array("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday");
weekShortDays = new Array("Sun", "Mon", "Tue", "Wedn", "Thu", "Fri", "Sat");

  /**
 * @param {Date} d The date
 */

function cricDate(d)  {
  var xxx = getISTtime();

  var myHour = xxx.getHours();
  var myampm = AMPM[myHour];
  if (myHour > 12) myHour -= 12;
  var tmp = `${MONTHNAME[xxx.getMonth()]} ${("0" + xxx.getDate()).slice(-2)} ${("0" + myHour).slice(-2)}:${("0" +  xxx.getMinutes()).slice(-2)}${myampm}`
  return tmp;
}


module.exports = {
  getLoginName, getDisplayName, cricDate,
  encrypt, decrypt, dbencrypt, dbdecrypt,
	dbToSvrText, svrToDbText,
	sendCricMail,
  userAlive,
  getBlankNSEDataRec, getBlankCurrNSEDataRec,
  revDate, datePriceKey,
  getISTtime, nseWorkingTime,
}; 
