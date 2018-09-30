// Copyright (c) 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import React from 'react';

import {XYPlot, 
        XAxis, 
        YAxis,  
        VerticalBarSeries, 
        VerticalRectSeries, 
        Highlight, 
        HorizontalGridLines, 
        VerticalGridLines} from 'index';

import {generateSeededRandom} from '../showcase-utils';
import {isUndefined} from 'util';
const seededRandom = generateSeededRandom(3);
const numTimes = 12;

class ControlledDragableChart extends React.Component {
  constructor(props) {
    super(props)
    // Create a list of unix times, 1 longer than our numTimes 
    // constant since the bar is defined from time n to n+1
    // meaning the possible times to select from needs an extra
    const times = [...new Array(numTimes + 1)]
      .map((t, i) => new Date(Date.UTC(2018, i, 1, 0, 0, 1, 0)).valueOf());
    
    const rawData = [];
    const histogramSize = 100;
    // Create a set of raw 
    for(let i = 0; i < numTimes; i++)
    {
      rawData.push([...new Array(histogramSize)]
      .map((t, ind) => ({x: ind * 10, y: seededRandom() * 1000})));
    }
    const timeData = times.slice(0, numTimes)
      .map((t, i) => ({x0: t, x: times[i + 1], y: Math.ceil(seededRandom() * 10)}));
    
    const histogramData = this.generateHistogram(rawData, null, times);
    this.state = {
      selectionStart: null,
      selectionEnd: null,
      times,
      timeData,
      rawData,
      histogramData,
      counter: 0,
      newHighlightArea: null,
    };
  }

  generateHistogram(rawData, area, times)
  {
    let total = 0;
    const aggregatedData = [];
    for(const md in rawData)
    {
      if(!area || (area.left <= times[md] && times[Number(md)+1] <= area.right))
      {
        const monthData = rawData[md];
        for(let d = 0; d < monthData.length; d++)
        {
          const dataPoint = monthData[d];
          const newPoint = {
            x: dataPoint.x, 
            y: (isUndefined(aggregatedData[dataPoint.x]) ? 
              dataPoint.y : dataPoint.y + aggregatedData[dataPoint.x].y)
          };
          aggregatedData[dataPoint.x] = newPoint;
        }
      }
    }

    for(const ad in aggregatedData)
    {
      if(aggregatedData.hasOwnProperty(ad))
        total += aggregatedData[ad].y;
    }

    const histogramData = [];
    for(const ad in aggregatedData)
    {
      if(aggregatedData.hasOwnProperty(ad))
        histogramData.push({x: aggregatedData[ad].x, y: (aggregatedData[ad].y / total) * 100.0})
    }
    return histogramData;
  }

  render() {
    const {selectionStart, selectionEnd, 
            times, timeData, rawData, histogramData, 
            counter,
            newHighlightArea} = this.state;
    // On new drag/brush event, update the histogram data set based off values within the new areas range
    const updateDragState = (newArea) => {
      const newHistData = this.generateHistogram(rawData, newArea, times);
      this.setState({
        histogramData: newHistData,
        selectionStart: newArea && newArea.left,
        selectionEnd: newArea && newArea.right,
        highlightX: null,
        highlightWidth: null,
      });
    }

    return (
      <div>
        <XYPlot width={800} height={150} xType="time-utc" 
          xDomain={[times[0] - ((times[numTimes] - times[0]) * .1), 
                    times[numTimes] + ((times[numTimes] - times[0]) * .1)]}>
          <XAxis tickValues={times.slice(0, numTimes)} 
            tickFormat={(x) => {return new Date(x).toUTCString().slice(8, 11)}}/>
          <VerticalGridLines/>
          <HorizontalGridLines/>
          <VerticalRectSeries
            data={timeData}
            stroke="blue"
            colorType="literal"
            getColor={d => {
              if (selectionStart === null || selectionEnd === null) {
                return 'blue';
              }
              // If both edges of the bar (denoted by x0 and x) are inside 
              // the highlighted region then color the bar green
              const inX = d.x >= selectionStart && d.x <= selectionEnd;
              const inX0 = d.x0 >= selectionStart && d.x0 <= selectionEnd;

              return  inX && inX0 ? 'green' : 'blue';
            }}
          />
          <Highlight control={(ctrl) => {this.highlightControls = ctrl}}
            newHighlightArea={newHighlightArea}
            color="#829AE3"
            drag
            enableX={true}
            enableY={false}
            onBrushEnd={(area) => updateDragState(area)}
            onDrag={(area) => updateDragState(area)}
          />
        </XYPlot>
        <button onClick={(e) => {
          const time0 = times[counter]
          const time1 = times[Math.min(counter + 1, numTimes)]
          const newArea = { 
            left: time0, 
            right: time1, 
            bottom: null,
            top: null
          };
          this.setState({newHighlightArea: newArea, 
                          counter: (counter + 1) % (numTimes)})
          // this.highlightControls.setHighlightArea(newArea);
        }}>{`Highlight  ${(new Date(times[counter]).toUTCString().slice(8, 11))}`}</button>
        <button onClick={(e) => {
          const bottom = Math.ceil(seededRandom() * 7);
          const top = Math.max(Math.ceil(seededRandom() * 7), bottom + 1)
          const newArea = { 
            left: null, 
            right: null, 
            bottom,
            top
          };
          this.setState({newHighlightArea: newArea})
          // this.highlightControls.setHighlightArea(newArea);
        }}>Highlight random Y range</button>
        <button onClick={(e) => {
          this.highlightControls.reset();
          this.setState({counter: 0})
        }}>Clear highlight</button>
        <button onClick={(e) => {
          this.highlightControls.highlightAll();
        }}>Highlight Everything</button>
        <div>
          <b>selectionStart:</b> {`${new Date(selectionStart).toUTCString()},`}
          <b>selectionEnd:</b> {`${new Date(selectionEnd).toUTCString()},`}
        </div>

        <XYPlot width={800} height={250}>
          <XAxis />
          <YAxis />
          <VerticalBarSeries data={histogramData}/>
          <VerticalGridLines />
          <HorizontalGridLines />
        </XYPlot>
      </div>
    ); 
  }
}

export default ControlledDragableChart;