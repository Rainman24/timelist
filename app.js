const express = require('express')
const app = express()
const fs = require('fs')
const pug= require('pug')
const session = require('express-session')
const bodyParser = require('body-parser')
const moment = require('moment')

const port = process.env.PORT || 3001

const sdir = "./sconfig.json"
var config

try {
  config = require(sdir)
}
catch (err) {
  config = {}
  console.log("unable to read file '" + sdir + "': ", err)
}


require('dotenv').config()
console.log(process.env.DB_USER)

const { Client } = require('pg')
const client = new Client({
	database: 'myspace',
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS
})

client.connect()

app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static('public'))
app.use(session(config.sessionScrt))

app.set('view engine', 'pug')
app.set('views', './views')

function timeString(arr){
	var timestring = []

	arr.forEach(function(dig){
		dig.toString().length<2 ? dig = '0' + dig.toString() : dig = dig.toString()
		timestring.push(dig)
	})

	return timestring
}

function tsformat(arr){
	return `${arr[0]}:${arr[1]}:${arr[2]}`
}

function base60sum(h,m,s){

	var tofm = parseInt(h)*60+parseInt(m)
	var tofs = tofm*60+parseInt(s) || tofm*60

	return tofs
}

function sumtobase60(s){

	var base = 60
	var hms = []

	var mtotal = Math.floor(s/base)
	var seconds = s-mtotal*base

	var htotal = Math.floor(mtotal/base)
	var minutes = mtotal-htotal*base

	var days = Math.floor(htotal/24)
	var hours = htotal-days*24

	hms.push(hours,minutes,seconds)

	return hms
}

app.get('/', function(req, res){
		res.render('index', {
				message: req.query.message,
				loggedin: false
	})
})

app.post('/signup', (req, res)=> {

	var username = req.body.username
	var password = req.body.password
	var fullname = req.body.fullname
	var email = req.body.email

	var select = {
		text: `SELECT * FROM users WHERE username = '${req.body.username}'`
	};

	client.query(select, (error, result)=> {
		
		if(req.body.password === req.body.confpass && result.rows.length === 0) {

		var insert = {
				text: `insert into users (username, password, fullname, email) values ('${username}', '${password}', '${fullname}', '${email}') returning *;`
		};
			
			client.query(insert, (error, result)=> {
				if(error){
					throw error
				}

				req.session.user = result.rows[0]
				
				res.redirect('/okay')
			})

		} else { res.redirect('/?message='+encodeURIComponent('Something went wrong, try matching password inputs')) }
	})

})

app.post('/login', (req, res)=> {
	
	var select = {
		text: `SELECT * FROM users WHERE username = '${req.body.username}'`
	}

	client.query(select, (error, result) => {
		if (error) throw error;
		
		if(result.rows.length === 0) {
			res.redirect('/?message='+encodeURIComponent('Incorrect Username'))

		} else if(result.rows[0].password === req.body.password) {
			req.session.user = result.rows[0]
			res.redirect('/okay')

		} else { res.redirect('/?message='+encodeURIComponent('Probably wrong password, Try again')) }
	})
})

app.post('/until', (req, res)=> {

	var user = req.session.user

	var note = req.body.note
	var hours = req.body.hours
	var minutes = req.body.minutes

	var since = Date.now()
	var now = new Date()

	var onsubmit = base60sum(now.getHours(), now.getMinutes(), now.getSeconds())
	var submitval = base60sum(hours,minutes,0)

	var interval;

	if(submitval>onsubmit){
		interval = (submitval-onsubmit)*1000
	} else if(onsubmit>submitval) {
		interval = (base60sum(24,0,0) - (onsubmit-submitval))*1000
	}

	var until = since+interval

	var insert = {
		text: `insert into newtimes (note, since, until, timespan, userid, active) values ('${note}', ${since}, ${until}, ${interval}, '${user.id}', TRUE) returning *;`
	}

	client.query(insert, function(error, result){
		if(error){
			throw error
		}

		res.redirect('/okay')
	})
})

app.post('/amount', (req, res)=> {

	var user = req.session.user

	var note = req.body.note
	var hours = req.body.hours
	var minutes = req.body.minutes

	var since = Date.now()
	var timespan = base60sum(hours,minutes,0)*1000
	var until = since+timespan

	var insert = {
		text: `insert into newtimes (note, userid, since, timespan, until, active) values ('${note}', '${user.id}', ${since}, ${timespan}, ${until}, TRUE) returning *;`
	}

	client.query(insert, function(error, result){
		if(error){
			throw error
		}

		res.redirect('/okay')
	})
})


app.get('/okay', function(req, res){
	var user = req.session.user

	var profile = {
		text: `select * from newtimes where userid = ${user.id}`
	}

	client.query(profile, function(error, result){
		if(error){
			throw error
		}
	
		res.render('okay', {
				user: req.session.user,
				times: result.rows,
				loggedin: true
		})
	})
})

app.get('/times1', function(req, res){
	var user = req.session.user

	var profile = {
		text: `select * from newtimes where userid = ${user.id}`
	}

	client.query(profile, function(error, result){
	
		res.send({
				user: req.session.user,
				times: result.rows,
				loggedin: true
		})
	})
})

app.delete('/delete/:id', function(req,res){
	var user = req.session.user

	var profile = {
		text: `delete from newtimes where id = ${req.params.id}`
	}

	client.query(profile, function(error, result){
		console.log(error ? error.stack : 'delete', result.rows)
	
		res.send({
				user: req.session.user,
				times: result.rows,
				loggedin: true
		})
	})
})

app.get('/logout', function(req, res) {
	req.session.destroy
	res.redirect('/')
})

app.listen(port, ()=> {
	console.log(`Listening to ${port}`)
})