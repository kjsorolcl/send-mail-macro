var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
let fs = require('fs');
const puppeteer = require('puppeteer');
const readline = require('readline');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

const createRLInterface = ()=>{
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
};

async function macro(page) {
    let naverIDList = [];

    let emailList = '';

    fs.readFile('./naver_id.txt', 'utf8', (err, data)=>{
        let array = data.split('\r\n');
        array.forEach(element=>{
             let idPwd = element.split('/');
             let obj = {id: idPwd[0], pwd: idPwd[1]};
             naverIDList.push(obj);
        });
    });
    fs.readFile('./list.txt', 'utf8', (err, data)=>{
        emailList = data.split('\n');
    });
    let message = '';
    fs.readFile('./mail.txt', 'utf8', (err, data)=>{
        message = data;
    });

    await page.waitFor(1000);
    console.log(naverIDList);

    for(let i = 0; i < emailList.length; i++) {
        await page.goto('https://www.naver.com');
        const login = await page.$('.link_login');
        await login.click();
        await page.waitForNavigation();

        let random = Math.floor(Math.random() * naverIDList.length);
        const {id, pwd} = naverIDList[random];

        await page.evaluate(`document.getElementById('id').value = '${id}'`);
        await page.evaluate(`document.getElementById('pw').value = '${pwd}'`);

        /*   await page.$eval('#id', (el, id) => {
               return el.value = id;
           }, ID);
           await page.$eval('#pw', (el, pwd) => {
               return el.value = pwd;
           }, PW);*/
        await page.click('.btn_global');
        await page.waitForNavigation();
        await page.click('.btn_cancel');

        let email = emailList[i];
        console.log(email);
        await page.goto('https://mail.naver.com');
        await page.waitFor(3000);
        await page.evaluate(`document.getElementsByClassName('btn_quickwrite')[0].click();`);
       // await page.$('.btn_quickwrite').then(button=>button.click());
        await page.waitFor(3000);
        await page.evaluate(`document.getElementById('toInput').value = '${email}'`);
        await page.evaluate(`document.getElementById('subject').value = '${title}'`);
        await page.waitFor(2000);
        await page.evaluate(`document.getElementsByClassName('se2_input_wysiwyg')[0].contentDocument.body.innerHTML = \`${message}\`;`)

        await page.waitFor(2000);
        await page.evaluate(`document.getElementById('sendBtn').click();`);
        await page.waitFor(intervalMin * 60 * 1000);
        await page.goto('https://nid.naver.com/nidlogin.logout?returl=https%3A%2F%2Fwww.naver.com');
        await page.waitFor(3000);
    }
    console.log('메일 전송이 모두 완료되었습니다.');
};

let title;
let intervalMin = '';


console.log('송신할 메일의 제목을 입력해주세요.(보낼 이메일 주소 목록은 list.txt, 메일 내용은 mail.txt 파일을 통해 참조)');
const rl = createRLInterface();
rl.on('line', line=>{
    title = line;

    rl.close();

    console.log('송신할 분 간격을 숫자로 입력해주세요.(첫번째 메일부터 순서대로 송신합니다.)');
    const rl2 = createRLInterface();
    rl2.on('line', line=>{
        intervalMin = parseInt(line);
        rl2.close();
        process.platform != 'darwin' ?
            puppeteer.launch({headless: true,
                executablePath: './node_modules\\puppeteer\\.local-chromium\\win64-782078\\chrome-win\\chrome.exe'}).then(browser=>{
                return browser.newPage().then(page=>{
                    macro(page);

                    return page;
                });//.then(()=>browser.close());
            }) : puppeteer.launch({headless: false}).then(browser=>{
                return browser.newPage().then(page=>{
                    macro(page);

                    return page;
                });//.then(()=>browser.close());
            })
    });
})
module.exports = app;
