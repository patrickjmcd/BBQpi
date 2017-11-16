window.onload = function() {
 
    var messages = [];
    var socket = io.connect('http://192.168.1.122:80');
    var field = document.getElementById("field");
    var sendButton = document.getElementById("send");
    var content = document.getElementById("content");
    var name = document.getElementById("name");
 
        // on message received we print all the data inside the #container div
    socket.on('notification', function (data) {
    	$('#tempGraph').highcharts('StockChart',{
		            chart : {
						events : {
							load : function() {
			
								// set up the updating of the chart each second
								var series = this.series[0];
								setInterval(function() {
									var x = (new Date()).getTime(), // current time
									y = Math.round(Math.random() * 100);
									series.addPoint([x, y], true, true);
								}, 1000);
							}
						}
					},
		            
		            title: {
		                text: 'Smoking Temperatures',
		                x: -20 //center
		            },
		            subtitle: {
		                text: 'Low & Slow!',
		                x: -20
		            },
		            xAxis: {
		                type: 'datetime',
                        tickInterval: 3600 * 1000, // one hour
                        tickWidth: 0,
                        gridLineWidth: 1,
                        labels: {
                            align: 'center',
                            x: -3,
                            y: 20,
                            formatter: function() {
                                return Highcharts.dateFormat('%l%p', this.value);
                            }
                        }
                    },
		            yAxis: {
		                title: {
		                    text: 'Temperature (°F)'
		                },
		                plotLines: [{
		                    value: 0,
		                    width: 1,
		                    color: '#808080'
		                }]
		            },
		            rangeSelector: {
						buttons: [{
							count: 1,
							type: 'minute',
							text: '1M'
						}, {
							count: 5,
							type: 'minute',
							text: '5M'
						}, {
							type: 'all',
							text: 'All'
						}],
						inputEnabled: false,
						selected: 0
					},
		            
		            tooltip: {
		                valueSuffix: '°F'
		            },
		            legend: {
		                layout: 'vertical',
		                align: 'right',
		                verticalAlign: 'middle',
		                borderWidth: 0
		            },
		            series: [{
		                name: 'Meat Temp',
		                data: [<%- meatTempObject%>]
		            }, {
		                name: 'Smoker Temp',
		                data: [<%- meatTempObject%>]
		            }]
		        });
        $('time').html('Last Update:' + data.time);
      });
 
}