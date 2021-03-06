var query = require('../util/dbconfig');
const fs = require('fs');
const POSLIST_VALUE = 'positionId,positionName,companyName,companyLogo,city,workYear,education,salary';

getId = (req, res) => {
    let sql = `select positionId from new`
    query(sql, [], (err, row) => {
        if(err) {
            res.json({
                code: 400,
                msg: '查询失败'
            })
        }else {
            fs.writeFile('./positionId.json',JSON.stringify(row),function(err){
                if(err){
                    console.log(err);
                    res.json({
                        code: 400,
                        msg: '查询失败'
                    })
                }else{
                    console.log("数据添加成功！");
                    res.json({
                        code: 200,
                        msg: '查询成功'
                    })
                }
            })
        }
    })
}

supplement = (req, res) => {
    console.log(/[<>\\]/.test(req.body.data.positionDesc))
    if(!/[<>\\]/.test(req.body.data.positionDesc)) {
        let { positionId, positionDesc, city_province } = req.body.data
            insertSql = `update new set positionDesc = ?, city_province = ? where positionId = ?`
            insertSqlArr = [positionDesc, city_province, positionId]
        query(insertSql, insertSqlArr, (err, row) => {
            if(err) {
                console.log(err)
                res.json({
                    code: 400,
                    msg: '存储失败'
                })
            }else if(row.affectedRows > 0) {
                console.log('存储成功')
                res.json({
                    code: 200,
                    msg: '存储成功'
                })
            }
        })
    }else {
        console.log(req.body.data)
        console.log('数据不完整，不储存')
        res.json({
            code: 400,
            msg: '数据不完整，不储存'
        })
    }
    

}

postPosDetail = (req, res) => {
    if(Object.keys(req.body.data).length === 24 && !/[<>\\]/.test(req.body.data.positionDesc)) {
        let {   
                positionId,
                companyId,
                positionName,
                companyName,
                companyLogo,
                companyLabelList,
                financeStage,
                companySize,
                positionLabels,
                positionAdvantage,
                positionDesc,
                city_province,
                district,
                longtitude,
                latitude,
                salary,
                city,
                workYear,
                education,
                jobNature,
                firstType,
                secondType,
                thirdType,
                createTime
            } = req.body.data

            let querySql = "select * from new_posdetail where positionId=?"
            let querySqlArr = [positionId]
            query(querySql, querySqlArr, (queryErr, queryRow) => {
                if(queryErr) {
                    console.log(queryRow)
                    res.json({
                        code: 500,
                        msg: '服务器出错'
                    })
                }
                //positionId查重
                if(queryRow.length) {
                    console.log('存储失败,该positionId已存在')
                    res.json({
                            code: 400,
                            msg: '该positionId已存在'
                    })
                }else {
                    let sql = "insert into new_posdetail (positionId, companyId, positionName, companyName, companyLogo, companyLabelList, financeStage, companySize, positionLabels, positionAdvantage, positionDesc, city_province, district, longtitude, latitude, salary, city, workYear, education, jobNature, firstType, secondType, thirdType, createTime) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"

                    let sqlArr = [ positionId, companyId, positionName, companyName, companyLogo, companyLabelList, financeStage, companySize, positionLabels, positionAdvantage, positionDesc, city_province, district, longtitude, latitude, salary, city, workYear, education, jobNature, firstType, secondType, thirdType, createTime ]
                    console.log(sqlArr)
                    query(sql, sqlArr, (err, row) => {
                        if(err) {
                            console.log(err)
                            res.json({
                                code: 400,
                                msg: '存储失败'
                            })
                        }else if(row.affectedRows > 0) {
                            console.log('存储成功')
                            res.json({
                                    code: 200,
                                    msg: '存储成功'
                            })
                        }
                    })
                }
            })
        
    } else {
        console.log(req.body.data)
        console.log('数据不完整，不储存')
        res.json({
            code: 400,
            msg: '数据不完整，不储存'
        })
    }
}

function getResult(row) {
    let rowList = []
    for(let i = 0; i< row.length; i++) {
        let keys = Object.keys(row[i])
        let obj = {}
        Object.values(row[i]).map((item, index) => {
            if(item) {
                if(item.indexOf("[") !== -1) {
                    obj[keys[index]] = item.split(/[\[\]]/g)[1].replace(/["\s]/g,"").split(',')
                }else {
                    obj[keys[index]] = item
                }
            }else {
                obj[keys[index]] = item
            }
        })
        rowList.push(obj)
    }
    return rowList
}

getPosDetail = (req, res) => {
    if(req.query.pid) {
        let pid = req.query.pid
        // sql = " select * from pos_detail where pid=?"
        sql = " select * from new_posdetail where positionId=?"
        sqlArr = [pid]
        query(sql, sqlArr, (err, row) => {
            if(err) {
                throw err
            }else {
                console.log('客户端positionId请求')
                const obj = getResult(row)
                res.json({
                    success: true,
                    msg: null,
                    code: 200,
                    data: obj
                })
            }
        })
    }
}

searchPos = (req, res) => {
    console.log(req.query)
    const { key, location, page, filter } = req.query
    let _page
    if(page !== 'undefined') {
        _page = (page - 1) * 10
    }else {
        _page = 0
    }
    let _key = `%${key}%`
    let originSql = 'concat(positionName,companyName,secondType,firstType) like ?'
    let originArr = [_key]
    if(location !== 'undefined') {
        let _location = `%${location}%`
        originSql += ` and concat(city,district) like ?`
        originArr.push(_location)
    }
    if(filter !== 'undefined') {
        let filterObj = JSON.parse(filter)
        let keysList = Object.keys(filterObj)
        keysList.map(item => {
            originSql += ` and ${item} like ?`
            let attr = ''
            if(filterObj[item].length > 1) {
                let currentArr = []
                filterObj[item].map(item => {
                    currentArr.push(`%${item}%`)
                })
                attr = `concat (${currentArr.join(',')})`
                
            }else {
                attr = `%${filterObj[item][0]}%`
            }
            originArr.push(attr)
        })
    }
    sql = `select ${POSLIST_VALUE} from new_posdetail where ${originSql} limit ${_page},10`
    sqlArr = originArr
    console.log(sql)
    console.log(sqlArr)
    query(sql, sqlArr, (err, row) => {
        if(err) {
            throw err
        }else {
            console.log('客户端请求')
            const obj = getResult(row)
            res.json({
                success: true,
                msg: null,
                code: 200,
                data: obj
            })
        }
    })
}

getPosList = (req, res) => {
    if(req.query.page) {
        let page = (req.query.page - 1) * 10
        sql = `select ${POSLIST_VALUE} from new_posdetail limit ${page},10`
        sqlArr = []
        query(sql, sqlArr, (err, row) => {
            if(err) {
                throw err
            }else {
                console.log('客户端请求')
                const obj = getResult(row)
                res.json({
                    success: true,
                    msg: null,
                    code: 200,
                    data: obj
                })
            }
        })
    }else {
        sql = `select ${POSLIST_VALUE} from new_posdetail limit 0,10`
        sqlArr = []
        query(sql, sqlArr, (err, row) => {
            if(err) {
                throw err
            }else {
                console.log('客户端请求')
                const obj = getResult(row)
                res.json({
                    success: true,
                    msg: null,
                    code: 200,
                    data: obj
                })
            }
        })
    }
    console.log("发生请求")
}

module.exports = {
    getId,
    supplement,
    postPosDetail,
    getPosDetail,
    searchPos,
    getPosList
}