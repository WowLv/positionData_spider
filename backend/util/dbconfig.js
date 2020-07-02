const mysql = require('mysql')
  //配置数据库
var pool = mysql.createPool({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '123456',
    database: 'posinfo'
  })
//连接数据库，使用mysql的连接池
var sqlConnect = (sql, sqlArr, callBack) => {
    pool.getConnection((err, conn) => {
        if(err) {
            callBack(err,null);
        }         
        conn.query(sql, sqlArr, (err, row) => {
            //释放连接
            conn.release()
            //事件驱动回调
            callBack(err, row)
        })
            
    })
}

module.exports = sqlConnect
