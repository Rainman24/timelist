$(document).ready(function(){

var refresh = setInterval(timeTo, 1000)
var mirrorcd = setInterval(mirror, 1000)

	function timeTo() {
		var now = new Date()
		$('#ut').html(now.toLocaleTimeString())
	};

function timeLeft(h,m,s){
	var now = new Date()

	var tval = []

	var hours = h - now.getHours()
	var minutes = m - now.getMinutes()
	var seconds = s - now.getSeconds()

	tval.push(hours, minutes, seconds)
	return tval
}

	function mirror() {

		var timestring = tsformat(timeString(timeLeft(23,59,59)))
		document.title = timestring
		$('#du').html(timestring)
	};

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


})