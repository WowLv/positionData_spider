const puppeteer = require('puppeteer');

function mwait(delay) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(`成功执行，延迟${delay/1000}s`)
        }, delay)
    })
}

async function saveInfo(browser, nowList) {
    let infoList = []
    // for(let n = 0; n < nowList.length; n++) {
    for(let n = 0; n < 2; n++) {
        await mwait(3000).then(msg => console.log(msg))
        let detailPage = await browser.newPage()
        await detailPage.goto(nowList[n], { waitUntil: 'networkidle0' })
        //爬取详细信息
        let companyLogo = await detailPage.$eval('#job_company .b2', el => {
            let imgReg = /\/\/www.lgstatic.com\/thumbnail_160x160(.*)/igs
            return imgReg.exec(el.getAttribute('src'))[1]
        })
        let positionId = await detailPage.$eval('#jobid', el => {
            return el.getAttribute('value')
        })
        let positionName = await detailPage.$eval('.position-content .job-name', el => {
            return el.getAttribute('title')
        })
        let requests = await detailPage.$$eval('.position-content-l .job_request h3 span', els => {
            let currList = []
            els.forEach(item => {
                currList.push(item.innerHTML.replace(/[\s\/]/g,""))
            })
            return currList
        })
        let positionLabels = await detailPage.$$eval('.job_request .position-label li', els => {
            let currList = []
            els.forEach(item => {
                currList.push(item.innerHTML)
            })
            return currList
        })
        //每一页为一个单位想数据库导入
        infoList.push(
            {
                positionId,
                positionName,
                companyLogo,
                positionLabels,
                salary: requests[0],
                city: requests[1],
                workYear: requests[2],
                education: requests[3],
                jobNature: requests[4]
            }
        )
        await detailPage.close()
    }
    // axios.post插入数据库
    console.log(infoList)
}

async function singlePage(browser, keysList) {
    let pagesList = []
    //关键字
    for(let i = 0; i<1; i++) {
        //页数
        for(let j = 1; j < 2; j++) {
            await mwait(3000).then(msg => {
                console.log(msg)
            })
            let singleKeyPage = await browser.newPage()
            await singleKeyPage.goto(keysList[i].href+j, { waitUntil: 'networkidle0' })
            let singlePageList = await singleKeyPage.$$eval('#s_position_list .position_link',(eles) => {
                let currList = []
                eles.forEach(item => {
                    currList.push(item.getAttribute("href"))
                })
                return currList
            })
            // pagesList.push(...singlePageList)
            await saveInfo(browser, singlePageList)
            await singleKeyPage.close()
        }
    }
}

async function getkeys() {
    let browser = await puppeteer.launch({headless:false});
    let page = await browser.newPage();
    await page.goto('https://www.lagou.com/');
    
    let keysList = await page.$$eval('#sidebar a', (eles) => {
        let currList = []
        eles.forEach(item => {
            let currObj = {
                key: item.innerHTML.replace(/[<\/h3>]/g,""),
                href: item.getAttribute("href")
            }
            currList.push(currObj)
        })
        return currList
    })
    await singlePage(browser, keysList)
}


getkeys()
