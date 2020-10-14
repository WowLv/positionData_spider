const puppeteer = require('puppeteer')
const superagent = require('superagent')
const cheerio = require('cheerio')
const axios = require('axios')
const fs = require('fs')
var _delay = 3000  //爬取间隔（ms）
var errorIndex = 0

function mwait(delay) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(`成功执行，延迟${delay/1000}s`)
        }, delay)
    })
}

async function saveInfo(browser, nowPageList) {
    for(let n = 0; n < nowPageList.length; n++) {
        // if(n%2 !== 0) {
            await mwait(_delay).then(msg => console.log(msg))
            let detailPage = await browser.newPage()
            try {
                await detailPage.goto(`https://www.lagou.com/jobs/${nowPageList[n]}.html`, { waitUntil: 'networkidle0' })
                let positionId = nowPageList[n]
                let positionDesc = await detailPage.$eval('#job_detail .job_bt .job-detail', el => {
                    return el.innerHTML.replace(/&nbsp;|\n|<\/p>[\s<(?!p).*?>]/g,'').split(/p>|<p>|<br>/)
                })
                let longitude = await detailPage.$eval('#job_detail .job-address input[name=positionLng]', el => {
                    return el.getAttribute('value')
                })
                let latitude = await detailPage.$eval('#job_detail .job-address input[name=positionLat]', el => {
                    return el.getAttribute('value')
                })
                let local = await axios.get('https://restapi.amap.com/v3/geocode/regeo', {
                    params: {
                        key: 'ca71f341bd8d847d79b958d2c40b4532',
                        s: 'rsv3',
                        location: `${longitude},${latitude}`
                    }
                })
                //每一个职位为一个单位想数据库导入
                let infoObj = {
                    positionId,
                    positionDesc: JSON.stringify(positionDesc),
                    city_province: local.data.regeocode.addressComponent.province,
                }
                // console.log(infoObj)
                // axios.post插入数据库
                let res = await axios.post('http://127.0.0.1:3000/supplement', {
                    data: infoObj,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                })
                console.log(`爬取成功第${n+1}条-${nowPageList[n]},准备导入如数据库`)
                await mwait(1000).then(msg => console.log(msg))
                console.log(res.data)
                await detailPage.close()
            } catch(err) {
                errorIndex = n + 1
                //请求超时关闭页面等待重新请求
                await detailPage.close()
                await browser.close()
                console.log('请求超时，重新访问')
                await mwait(5000).then(msg => console.log(msg))
                await getkeys(nowPageList.slice(errorIndex, nowPageList.length))
            }
            //爬取详细信息
          
            
        // }
    }
    console.log('当前页面已爬取完成')
}

async function getkeys(keysList) {
    let browser = await puppeteer.launch({headless:true});
    let page = await browser.newPage();
    await page.goto('https://www.lagou.com/');

    await saveInfo(browser, keysList)
    await browser.close()
    console.log('爬取结束')
}

function getIdList() {
    let myList = []
    let data = fs.readFileSync('./positionId.json').toString()
    data = JSON.parse(data)
    data.map(item => {
        myList.push(parseInt(item.positionId))
    })
    return myList
}

let keysList = getIdList()
getkeys(keysList)
