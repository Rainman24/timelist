$(document).ready(function(){

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

$.get('/times1', function(data){

	data.times.forEach(function(item){

		var ul = $('<ul class="list"></ul>')

		var since = new Date(parseInt(item.since)).toLocaleTimeString()
		var until = new Date(parseInt(item.until)).toLocaleTimeString()

		var startoftheday = new Date()
		var today = Date.now() - (base60sum(startoftheday.getHours(),startoftheday.getMinutes(),startoftheday.getSeconds())*1000)

		if(parseInt(item.since)>today){

		$(ul).append(`
			<li class='note'>${item.note}</li>
			<li class='since' data-since=${item.since}>${since}</li>
			<li class='timespan' data-timespan=${item.timespan} data-until=${item.until}></li>
			<li class='until' data-until=${item.until}>${until}</li>
			<button class="delete" data-deleting=${item.id}>X</button>
			`)
		
		$('.tdtl').append(ul)
		}
	});

	$('.tdtl ul').on('click', function(evnt){

		if(evnt.target.className == 'delete'){

		var deleting = evnt.target.dataset.deleting
		var url = 'delete/'+deleting

		$(evnt.target.parentNode).css({background: 'rgba(127,127,127,0.1)'})

			if(window.confirm('Are you sure that you want to delete this?')){

				$.ajax({
					url: url,
					type: 'DELETE',
					success: function(result){
						console.log('good job, it\'s gone')
						window.location.href='/okay'
					},
					error: function(err){
						console.log(err)
					}
				})
			}
		
		}
	});

});

$.get('/okay', function(data){
	
	$('ul.list').each(function(index, element){

		var timedif;
		var ref;

		$(element.childNodes).each(function(index, element){
			
			if(element.tagName=='LI'&&element.className=='timespan'){

				function timelapse(){

					timedif = parseInt(element.dataset.until)-Date.now()

					if(timedif>0){
						$(element).text(tsformat(timeString([new Date(timedif).getUTCHours(),new Date(timedif).getUTCMinutes(),new Date(timedif).getUTCSeconds()])))
					
					} else {
						clearInterval(ref)
						$(element).text('it\'s over')
					}

				}

			ref = setInterval(timelapse, 1000)

			}
		})
	})
});

});