const puppeteer = require('puppeteer')
const superagent = require('superagent')
const cheerio = require('cheerio')
const axios = require('axios')
var _currentkey = 110
var _currentPage = 1

function mwait(delay) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(`成功执行，延迟${delay/1000}s`)
        }, delay)
    })
}

async function saveInfo(browser, nowPageList, typeInfo) {
    let { firstType, secondType,  thirdType } = typeInfo
    for(let n = 0; n < nowPageList.length; n++) {
        if(n%2 !== 0) {
            await mwait(2000).then(msg => console.log(msg))
            let detailPage = await browser.newPage()
            try {
                await detailPage.goto(nowPageList[n], { waitUntil: 'networkidle0' })
            } catch(err) {
                //请求超时关闭页面等待重新请求
                await detailPage.close()
                await browser.close()
                console.log('请求超时，重新访问')
                await mwait(5000).then(msg => console.log(msg))
                await getkeys()
            }
            //爬取详细信息
            let companyLogo = await detailPage.$eval('#job_company img', el => {
                let imgReg = /\/\/www.lgstatic.com\/thumbnail_160x160(.*)/igs
                return imgReg.exec(el.getAttribute('src'))[1]
            })
            let companyName = await detailPage.$eval('#job_company .fl-cn', el => {
                return el.innerHTML.replace(/\s/g,"")
            })
            let companyInfos =  await detailPage.$$eval('#job_company .c_feature li .c_feature_name', els => {
                let currList = []
                els.forEach(item => {
                    currList.push(item.innerText.replace(/\s/g,""))
                })
                if(currList.length === 4) {
                    return currList.splice(0,3)
                }else {
                    return [].concat(currList[0],currList[1],currList[3])
                }
                
            })
            let positionId = await detailPage.$eval('#jobid', el => {
                return el.getAttribute('value')
            })
            let companyId = await detailPage.$eval('#companyid', el => {
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
            let positionAdvantage = await detailPage.$eval('#job_detail .job-advantage p', el => {
                return el.innerText.replace(/\s/g,'')
            })
            let longtitude = await detailPage.$eval('#job_detail .job-address input[name=positionLng]', el => {
                return el.getAttribute('value')
            })
            let latitude = await detailPage.$eval('#job_detail .job-address input[name=positionLat]', el => {
                return el.getAttribute('value')
            })
            // let district = await detailPage.$$eval('#job_detail .work_addr a', els => {
            //     return els[1].innerText
            // })
            let positionDesc = await detailPage.$eval('#job_detail .job_bt .job-detail', el => {
                return el.innerHTML.replace(/&nbsp;|\n|<\/p>[\s<(?!p).*?>]/g,'').split(/p>|<p>|<br>/)
            })
            let local = await axios.get('https://restapi.amap.com/v3/geocode/regeo', {
                params: {
                    key: 'ca71f341bd8d847d79b958d2c40b4532',
                    s: 'rsv3',
                    location: `${longtitude},${latitude}`
                }
            })
            let city
            if(local.data.regeocode.addressComponent.city instanceof Array) {
                city = local.data.regeocode.addressComponent.province
            }else {
                city = local.data.regeocode.addressComponent.city
            }
            let createTime = await detailPage.$eval('.job_request .publish_time', el => {
                if(el.innerText.indexOf('-') !== -1) {
                    return el.innerText.split(' ')[0].trim()
                }else if(el.innerText.indexOf('天前') !== -1){
                    let day = el.innerText.split('天前')[0]
                    let date = new Date(Date.now() - 1000 * 60 * 60 * 24 * parseInt(day))
                    let strDate = date.getFullYear()+"-";
                    if(date.getMonth()<10){
                        var s = date.getMonth()+1+"-";
                        strDate += "0"+s;
                    }else{
                        strDate += date.getMonth()+1+"-";
                    }

                    if(date.getDate()<10){
                         strDate += "0"+date.getDate();
                    }else{
                        strDate += date.getDate();
                    }
                    return strDate
                }else {
                    let date = new Date(Date.now())
                    let strDate = date.getFullYear()+"-";
                    if(date.getMonth()<10){
                        var s = date.getMonth()+1+"-";
                        strDate += "0"+s;
                    }else{
                        strDate += date.getMonth()+1+"-";
                    }

                    if(date.getDate()<10){
                         strDate += "0"+date.getDate();
                    }else{
                        strDate += date.getDate();
                    }
                    return strDate
                }
            })

            // 
            //每一个职位为一个单位想数据库导入
            let infoObj = {
                positionId,
                companyId,
                positionName,
                companyName,
                companyLogo,
                companyLabelList: JSON.stringify(companyInfos[0].split(',')),
                financeStage: companyInfos[1],
                companySize: companyInfos[2],
                positionLabels: JSON.stringify(positionLabels),
                positionAdvantage: JSON.stringify(positionAdvantage.split(/,|、/)),
                positionDesc: JSON.stringify(positionDesc),
                district: local.data.regeocode.addressComponent.district,
                city_province: local.data.regeocode.addressComponent.province,
                longtitude,
                latitude,
                salary: requests[0],
                city,
                workYear: requests[2],
                education: requests[3],
                jobNature: requests[4],
                firstType,
                secondType,
                thirdType,
                createTime
            }
            // console.log(infoObj)
            // axios.post插入数据库
            let res = await axios.post('http://127.0.0.1:3000/posDetail', {
                data: infoObj,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            })
            console.log('爬取成功,准备导入如数据库')
            await mwait(1000).then(msg => console.log(msg))
            console.log(res.data)
            await detailPage.close()
        }
    }
    console.log('当前页面已爬取完成')
}

async function singlePage(browser, keysList) {
    // 关键字
    for(let i = _currentkey; i<keysList.length; i++) {
        _currentkey = i
        console.log(`当前爬取分类为 => "${i} - ${keysList[i].thirdType}"`)
        await mwait(3000).then(msg => {
            console.log(msg)
        })
        //页数
        for(let j = _currentPage; j <= 10; j++) {
            
            console.log(`准备爬取第${j}页`)
            if(j === 10) {
                _currentPage = 1
            } else {
                _currentPage = j
            }
            await mwait(2000).then(msg => {
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
            await saveInfo(browser, singlePageList, keysList[i])
            await singleKeyPage.close()
        }
    }
}

async function getkeys() {
    let browser = await puppeteer.launch({headless:true});
    let page = await browser.newPage();
    await page.goto('https://www.lagou.com/');

    const url = 'https://www.lagou.com/'
    let res = await superagent.get(url)
    const $ = cheerio.load(res.text)
    let keysList = []
    $('#sidebar .menu_box').each((i, el) => {
        $(el).find('.menu_sub dl').each((_i, _el) => {
            $(_el).find('a').each((__i, __el) => {
                let keysObj = {
                    firstType: $(el).find('.category-list h2').text().replace(/\s/igs,""),
                    secondType: $(_el).find('dt').text().replace(/\s/igs,""),
                    thirdType: $(__el).text().replace(/\s/igs,""),
                    href: $(__el).attr('href')
                }
                keysList.push(keysObj)
            })
        })
    })

    await singlePage(browser, keysList)
}


getkeys()
