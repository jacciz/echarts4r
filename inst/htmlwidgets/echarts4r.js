HTMLWidgets.widget({

  name: 'echarts4r',

  type: 'output',

  factory: function(el, width, height) {

    var initialized = false;

    var chart,opts;

    const evalFun = (sourceOpts) => {
      let opts = Object.assign({}, sourceOpts);
      Object.keys(opts).forEach((key) => {
        if (opts[key] !== null) {
          if (typeof opts[key] === 'object') {
            evalFun(opts[key]);
            return;
          }
          if (typeof opts[key] === 'string') {
            try {
              opts[key] = eval('(' + opts[key] + ')');
            } catch { }
          }
        }
      });
      return(opts);
    }

    return {

      renderValue: function(x) {

        if(x.dispose === true){
          chart = echarts.init(document.getElementById(el.id));
          chart.dispose();
        }

        if (!initialized) {
          initialized = true;
          if(x.theme2 === true){
            var th = JSON.parse(x.customTheme);
            echarts.registerTheme(x.theme_name, th);
          }

        }

        if(x.hasOwnProperty('registerMap')){
          for( var map = 0; map < x.registerMap.length; map++){
            if(x.registerMap[map].extra)
              echarts.registerMap(x.registerMap[map].mapName, x.registerMap[map].geoJSON, x.registerMap[map].extra);
            else
              echarts.registerMap(x.registerMap[map].mapName, x.registerMap[map].geoJSON);
          }
        }

        if(x.hasOwnProperty('mapboxToken')){
          mapboxgl.accessToken = x.mapboxToken;
        }

        if(!x.mainOpts)
          x.mainOpts = [];
        x.mainOpts.renderer = x.renderer;

        chart = echarts.init(document.getElementById(el.id), x.theme, x.mainOpts);

        opts = evalFun(x.opts);

        if(x.morphed){
          opts = x.opts[0][x.morphed.default]
        }

        if(x.draw === true)
          chart.setOption(opts);

  // ── ADD CROSSTALK BLOCK RIGHT AFTER setOption ──────────────────────
        if (x.settings.crosstalk_group) {
          var tmp = opts.series.findIndex(x => x.datasetId === 'Xtalk');
        if (tmp==undefined)
          console.log('no series found preset for crosstalk')
      	console.log(' echarty crosstalk on');
      	chart.sext = tmp;
      	chart.sele = [];

/*
  ctSel.on('change', function(e) {

    if (e.sender === ctSel) return;  // ignore own events
    applyFilter(e.value, chart);
  });


  ctFilter.on('change', function(e) {
    if (e.sender === ctFilter) return;
    applyFilter(e.value, chart);
  });

  chart.on('click', function(params) {
    var key = params.data && params.data.XkeyX;
    if (key) ctSel.set([String(key)]);
  });

  chart.getZr().on('click', function(e) {
    if (!e.target) ctSel.set([]);
  });
*/

// echarty
      	var sel_handle = new crosstalk.SelectionHandle();
      	sel_handle.setGroup(x.settings.crosstalk_group);
      	var ct_filter =  new crosstalk.FilterHandle();
      	ct_filter.setGroup(x.settings.crosstalk_group);
      	  // store all keys on chart for lookup - this is what chart.filk needs
  chart.akeys = x.settings.crosstalk_key;  // all keys
  chart.filk  = x.settings.crosstalk_key;  // keys indexed by data position


chart.on("brushselected", function(params) {
  if (!params.batch || !params.batch[0].areas || params.batch[0].areas.length === 0) {
    sel_handle.set([]);
    return;
  }

  var range = params.batch[0].areas[0].range;
  var selectedKeys = [];

  // get the actual data length from the series
  var opt = chart.getOption();
  var seriesData = opt.series[chart.sext].data;
  var nPoints = seriesData ? seriesData.length : chart.akeys.length;

  for (var i = 0; i < nPoints; i++) {
    // convert data point to pixel - use actual y value not 0
    var dataVal = seriesData ? seriesData[i] : null;
    var yVal = dataVal ? (dataVal.value ? dataVal.value[1] : dataVal[1]) : 0;
    var xVal = seriesData ? (dataVal.value ? dataVal.value[0] : dataVal[0]) : i;

    var pt = chart.convertToPixel({seriesIndex: chart.sext}, [xVal, yVal]);
    console.log("bar", i, "pixel:", pt, "key:", chart.akeys[i]);

    if (pointInPolygon(pt, range)) {
      selectedKeys.push(String(chart.akeys[i]));
    }
  }

      console.log("selected keys:", selectedKeys);
      sel_handle.set(selectedKeys);
    });
    function pointInPolygon(point, polygon) {
      var x = point[0], y = point[1];
      var inside = false;
      for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        var xi = polygon[i][0], yi = polygon[i][1];
        var xj = polygon[j][0], yj = polygon[j][1];
        var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    }
var opt = chart.getOption();


      	chart.on("brushEnd", function(keys) {    // release selection FROM echarty
      	console.log('brushend');
      		if (keys.areas.length==0)
      			sel_handle.set([]);
      			//sel_handle.set(this.akeys.map(String));  // restore
      	})

        	chart.on("selectchanged", function(keys) { // send keys FROM echarty
        	console.log('select_change');
        	console.log(keys.selected);
        		let items = [];
        		if (keys.selected.length>0)
        		    items = keys.selected[0].dataIndex;
        		if (keys.isFromClick) {
        		  //if (items.length==0) items = this.akeys; // send all keys: bad for map
        	    tmp = items.map(i=> chart.filk[i])
        		  sel_handle.set(tmp.map(String));
              chart.sele = items;
        		}
      	})

        sel_handle.on("change", function(e) {
          if (e.sender == sel_handle) return;

          // clear previous highlight
          if (e.oldValue && e.oldValue.length > 0) {
            tmp = e.oldValue.map(r => chart.akeys.indexOf(r));  // use akeys not filk
            tmp = tmp.filter(i => i > -1);  // remove -1 (not found)
            console.log("downplay indices:", tmp);
            chart.dispatchAction({ type: 'downplay',
              seriesIndex: chart.sext, dataIndex: tmp });
          }

          if (e.value && e.value.length > 0) {
            tmp = e.value.map(r => chart.akeys.indexOf(r));  // use akeys not filk
            tmp = tmp.filter(i => i > -1);
            console.log("highlight indices:", tmp);
            chart.dispatchAction({ type: 'highlight',
              seriesIndex: chart.sext, dataIndex: tmp });
          }
        });

ct_filter.on('change', function(e) {
  if (e.sender == ct_filter) return;
  if (e.value == undefined) e.value = chart.akeys;

  rexp = (e.value.length == chart.akeys.length)
    ? '^' : '^('+ e.value.join('|') +')$';

  var opt = chart.getOption();
  // update ALL Xtalk datasets
  opt.dataset.forEach(function(d) {
    if (d.id && d.id.startsWith('Xtalk_')) {
      d.transform[1].config.reg = rexp;  // second transform is the key filter
    }
  });
  chart.setOption(opt, false);
});
      	/*

            // cache original data for both timeline and non-timeline
          var isTimeline = x.tl;

          var originalOptions = isTimeline
            ? JSON.parse(JSON.stringify(x.opts.options))  // [{series:[...]}, {series:[...]}, ...]
            : JSON.parse(JSON.stringify(x.opts.series));  // [{data:[...]}, ...]

          // safely get the source data
          var rawSeries  = isTimeline
            ? (x.opts && x.opts.options)
            : (x.opts && x.opts.series);

          var originalOptions = JSON.parse(JSON.stringify(rawSeries));


                  // Outbound: broadcast clicks to other widgets
                  chart.on("click", function(params) {
                    var key = params.data && params.data.ct_key;
                    if (key) ctSel.set([key]);
                  });

                  // Clear selection when clicking blank canvas
                  chart.getZr().on("click", function(e) {
                    if (!e.target) ctSel.set([]);
                  });

                  // Inbound: receive selections from other widgets
          ctSel.on("change", function(e) {
              console.log("received keys:", e.value);
  console.log("series data:", JSON.stringify(chart.getOption().series[0].data));
            var keys = e.value;

            if (isTimeline) {
                 // find which frame index matches the selected key
              originalOptions.forEach(function(opt, oi) {
                if (!opt.series) return;
                opt.series.forEach(function(s) {
                  s.data.forEach(function(d) {
                    if (d && keys.indexOf(d.ct_key) > -1) {
                      // navigate timeline to this frame
                      chart.dispatchAction({
                        type: "timelineChange",
                        currentIndex: oi
                      });
                    }
                  });
                });
              });
            } else {
              // non-timeline
              originalOptions.forEach(function(s, si) {
                var newData = s.data.map(function(d) {
                  if (!keys || keys.length === 0) return d;
                  return keys.indexOf(d.ct_key) > -1 ? d : null;
                });
                chart.setOption({ series: [{ data: newData }] }, false);
              });
            }
          });

        // outbound: chart click → broadcast selection
        chart.on("click", function(params) {
        var key = params.data && params.data.ct_key;
        console.log("clicked key:", key);
        if (key) ctSel.set([key]);
      });
        chart.getZr().on("click", function(e) {
          if (!e.target) ctSel.set([]);
        });
          // Inbound: receive filter changes (filter_select, filter_slider etc.)
          ctFilter.on("change", function(e) {
            var keys = e.value;
            _x.opts.series.forEach(function(s, si) {
              var filtered = keys
                ? s.data.map(function(d) { return keys.indexOf(d.ct_key) > -1 ? d : null; })
                : s.data;
              chart.setOption({ series: [{ data: filtered }] }, false);
            });
          });
*/
        }
        // ── END CROSSTALK BLOCK ────────────────────────────────────────────
        // shiny callbacks
        if (HTMLWidgets.shinyMode) {

          chart.on("brushselected", function(e){
            Shiny.onInputChange(el.id + '_brush' + ":echarts4rParse", e);
          });

          chart.on("brush", function(e){
            Shiny.onInputChange(el.id + '_brush_released' + ":echarts4rParse", e);
          });

          chart.on("legendselectchanged", function(e){
            Shiny.onInputChange(el.id + '_legend_change' + ":echarts4rParse", e.name);
            Shiny.onInputChange(el.id + '_legend_selected' + ":echarts4rParse", e.selected);
          });

          chart.on("globalout", function(e){
            Shiny.onInputChange(el.id + '_global_out' + ":echarts4rParse", e, {priority: 'event'});
          });

          if(x.hasOwnProperty('zr')){
            chart.getZr().on("click", function(e){
              delete e.stop;
              delete e.topTarget;
              delete e.target
              delete e.event.path;
              Shiny.setInputValue(el.id + '_clicked_zr' + ":echarts4rParse", e);
            });
          }

          if(x.hasOwnProperty('capture')){
            chart.on(x.capture, function(e){
              Shiny.onInputChange(el.id + '_' + x.capture + ":echarts4rParse", e, {priority: 'event'});
            });
          }

        chart.getZr().on('dragend', function(e) {
          if (e.target &&
              e.target.id != null &&
              String(e.target.id).startsWith('box_')) {

            var annotationData = null;
            for (var index in el._annotationData) {
              if (el._annotationData[index].box_id === e.target.id) {
                annotationData = el._annotationData[index];
                break;
              }
            }

            if (annotationData) {
              Shiny.onInputChange(
                el.id + "_dragged_annotation" + ":echarts4rParse",
                annotationData
              );
            }
          }
        });

          chart.on("click", function(e){
            Shiny.onInputChange(el.id + '_clicked_data' + ":echarts4rParse", e.data, {priority: 'event'});
            Shiny.onInputChange(el.id + '_clicked_row' + ":echarts4rParse", e.dataIndex + 1, {priority: 'event'});
            Shiny.onInputChange(el.id + '_clicked_serie' + ":echarts4rParse", e.seriesName, {priority: 'event'});
          });

          chart.on("mouseover", function(e){
            Shiny.onInputChange(el.id + '_mouseover_data' + ":echarts4rParse", e.data);
            Shiny.onInputChange(el.id + '_mouseover_row' + ":echarts4rParse", e.dataIndex + 1);
            Shiny.onInputChange(el.id + '_mouseover_serie' + ":echarts4rParse", e.seriesName);
          });

          $(document).on('shiny:recalculating', function() {

            if(x.hideWhite === true){
              var css = '.recalculating {opacity: 1.0 !important; }',
                  head = document.head || document.getElementsByTagName('head')[0],
                  style = document.createElement('style');

              style.type = 'text/css';
              if (style.styleSheet){
                style.styleSheet.cssText = css;
              } else {
                style.appendChild(document.createTextNode(css));
              }
              head.appendChild(style);
            }

            if(x.loading === true){
              chart.showLoading('default', x.loadingOpts);
            } else if(x.loading === false) {
              chart.hideLoading();
            }

          });

          $(document).on('shiny:value', function() {
            chart.hideLoading();
          });
        }

        if(x.hasOwnProperty('connect')){
          var connections = [];
          for(var c = 0; c < x.connect.length; c++){
            connections.push(get_e_charts(x.connect[c]));
          }
          connections.push(chart);
          echarts.connect(connections);
        }

        // actions
        if(x.events.length >= 1){
          for(var i = 0; i < x.events.length; i++){
            chart.dispatchAction(x.events[i].data);
          }
        }

        // buttons
        var buttons = x.buttons;
        Object.keys(buttons).map( function(buttonId){
          document.getElementById(buttonId).addEventListener('click',
            (function(id) {
              const scoped_id = id;
              return function(e){
                buttons[scoped_id].forEach(function(el){
                  chart.dispatchAction(el.data);
                });
              };
            }
            )(buttonId)
          );
        });

        if(x.hasOwnProperty('on')){
          for(var e = 0; e < x.on.length; e++){
            chart.on(x.on[e].event, x.on[e].query, x.on[e].handler);
          }
        }

        if(x.hasOwnProperty('off')){
          for(var ev = 0; ev < x.off.length; ev++){
            chart.off(x.off[ev].event, x.off[ev].query, x.off[ev].handler);
          }
        }

        if(x.hasOwnProperty('chartGroup')){
          chart.group = x.chartGroup;
        }

        if(x.hasOwnProperty('groupConnect')){
          echarts.connect(x.groupConnect);
        }

        if(x.hasOwnProperty('groupDisconnect')){
          echarts.disconnect(x.groupDisconnect);
        }

        if(x.morphed){
          opts = x.opts[0];
          console.log(x.morphed);
          let fn = eval(x.morphed.callback);
          fn();
        }

      },

      getChart: function(){
        return chart;
      },

      getOpts: function(){
        return opts;
      },

      resize: function(width, height) {
        if(!chart)
          return;

        chart.resize({width: width, height: height});
      }

    };
  }
});

function get_e_charts(id){

  var htmlWidgetsObj = HTMLWidgets.find("#" + id);

  var echarts;

  if (typeof htmlWidgetsObj != 'undefined') {
    echarts = htmlWidgetsObj.getChart();
  }

  return(echarts);
}

function get_e_charts_opts(id){

  var htmlWidgetsObj = HTMLWidgets.find("#" + id);

  var echarts;

  if (typeof htmlWidgetsObj != 'undefined') {
    echarts = htmlWidgetsObj.getOpts();
  }

  return(echarts);
}

function distinct(value, index, self) {
  return self.indexOf(value) === index;
}

function rm_undefined(el){
  return el != undefined;
}

if (HTMLWidgets.shinyMode) {

  // DRAW
  Shiny.addCustomMessageHandler('e_draw_p',
    function(data) {
      var chart = get_e_charts(data.id);
      var opts = get_e_charts_opts(data.id);
      if (typeof chart != 'undefined') {
        chart.setOption(opts);
      }
  });

  // HIGHLIGHT AND DOWNPLAY

  Shiny.addCustomMessageHandler('e_highlight_p',
    function(data) {
      var chart = get_e_charts(data.id);
      if (typeof chart != 'undefined') {
        chart.dispatchAction({
          type: 'highlight',
          seriesIndex: data.seriesIndex,
          seriesName: data.seriesName
        });
      }
  });

  Shiny.addCustomMessageHandler('e_downplay_p',
    function(data) {
      var chart = get_e_charts(data.id);
      if (typeof chart != 'undefined') {
        chart.dispatchAction({
          type: 'downplay',
          seriesIndex: data.seriesIndex,
          seriesName: data.seriesName
        });
      }
  });

  // TOOLTIP

  Shiny.addCustomMessageHandler('e_showtip_p',
    function(data) {
      var chart = get_e_charts(data.id);
      if (typeof chart != 'undefined') {
        chart.dispatchAction(data.opts);
      }
  });

  Shiny.addCustomMessageHandler('e_hidetip_p',
    function(data) {
      var chart = get_e_charts(data.id);
      if (typeof chart != 'undefined') {
        chart.dispatchAction({
          type: 'hideTip'
        });
      }
  });

  Shiny.addCustomMessageHandler('e_append_p',
    function(opts) {
      var chart = get_e_charts(opts.id);
      if (typeof chart != 'undefined') {
        chart.appendData({
          seriesIndex: opts.seriesIndex,
          data: opts.data
        });
      }
  });

  Shiny.addCustomMessageHandler('e_focus_node_adjacency_p',
    function(data) {
      console.log(data);
      var chart = get_e_charts(data[0].id);
      if (typeof chart != 'undefined') {
        data.forEach(function(highlight){
          chart.dispatchAction(highlight.opts);
        })
      }
  });

  Shiny.addCustomMessageHandler('e_unfocus_node_adjacency_p',
    function(data) {
      var chart = get_e_charts(data[0].id);
      if (typeof chart != 'undefined') {
        data.forEach(function(highlight){
          chart.dispatchAction(highlight.opts);
        })
      }
  });

  Shiny.addCustomMessageHandler('e_dispatch_action_p',
    function(data) {
      var chart = get_e_charts(data.id);
      if (typeof chart != 'undefined') {
        chart.dispatchAction(data.opts);
      }
  });

  Shiny.addCustomMessageHandler('e_register_map',
    function(data) {
      if (typeof chart != 'undefined') {
        $.ajax({
          url: data.geoJSON,
          dataType: 'json',
          async: data.mapAsync,
          success: function(json){
            echarts.registerMap(data.mapName, json);
          }
        });

      }
  });

  Shiny.addCustomMessageHandler('e_resize',
    function(data) {
      var chart = get_e_charts(data.id);
      if (typeof chart != 'undefined') {
        chart.resize();
      }
  });

  Shiny.addCustomMessageHandler('e_send_p',
    function(data) {
      var chart = get_e_charts(data.id);
      if (typeof chart != 'undefined') {
        let opts = chart.getOption();

        // add series
        if(!opts.series)
          opts.series = [];

        if(data.opts.series)
          data.opts.series.forEach(function(serie){
            opts.series.push(serie);
          });

        if(data.opts.color){
          if(data.opts.appendColor)
            data.opts.color.forEach(function(color){
              opts.color.push(color);
            });
          else
            opts.color = data.opts.color;
        }

        if(data.opts.backgroundColor)
          opts.color = data.opts.backgroundColor;

        // legend
        if(data.opts.legend && opts.legend.length > 0)
          if(data.opts.legend.data)
            opts.legend[0].data = opts.legend[0].data.concat(data.opts.legend.data);

        // x Axis
        if(opts.xAxis){
          if(opts.xAxis[0].data){
            let xaxis = opts.xAxis[0].data.concat(data.opts.xAxis[0].data);
            xaxis = xaxis.filter(distinct).filter(rm_undefined);
            opts.xAxis[0].data = xaxis;
          }
        }

        // y Axis
        if(opts.yAxis){
          if(opts.yAxis[0].data){
            let yaxis = opts.yAxis[0].data.concat(data.opts.yAxis[0].data);
            yaxis = yaxis.filter(distinct).filter(rm_undefined);
            opts.yAxis[0].data = yaxis;
          }
        }

        chart.setOption(opts, true);
      }
  });

  Shiny.addCustomMessageHandler('e_remove_serie_p',
    function(data) {

      var chart = get_e_charts(data.id);
      if (typeof chart != 'undefined') {
        let opts = chart.getOption();

        if(data.serie_name){
          let series = opts.series;
          series.forEach(function(s, index){
            if (typeof s.name == "undefined"){
             if (s.data[[0]].name == data.serie_name){
               this.splice(index, 1);
             }
            } else {
            if(s.name == data.serie_name){
              this.splice(index, 1);
            }
            }
          }, series)
          opts.series = series;
        }

        if(data.serie_index != null){
          opts.series = opts.series.splice(data.serie_index, 1);
        }

        chart.setOption(opts, true);
      }
  });

  Shiny.addCustomMessageHandler('e_merge_p',
    function(data) {
      // called by e_merge, add marks to serie
      var chart = get_e_charts(data.id);
      if (typeof chart != 'undefined') {
        chart.setOption(data.opts);
      }
  });

}
