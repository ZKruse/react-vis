import React from 'react';
import AbstractSeries from './series/abstract-series';
import {getAttributeScale} from 'utils/scales-utils';
import PropTypes from 'prop-types';
import {isNullOrUndefined, isUndefined} from 'util';
function getLocs(evt) {
  const xLoc = evt.type === 'touchstart' ? evt.pageX : evt.offsetX;
  const yLoc = evt.type === 'touchstart' ? evt.pageY : evt.offsetY;
  return {xLoc, yLoc};
}

class Highlight extends AbstractSeries {
  state = {
    dragging: false,
    brushArea: {top: 0, right: 0, bottom: 0, left: 0},
    brushing: false,
    startLocX: 0,
    startLocY: 0,
    dragArea: null
  };

  componentDidMount() {
    // Couldn't get normal refs to assign to the Highlight control for some reason
    // so this exposes the 3 control methods to the control prop method. 
    // The parent class can then access them with the following declaration:
    // <Highlight control={(ctrl) => this.highlightControls = ctrl} ... />
    // The parent class can subsequently call 
    // this.highlightControls.highlightAll()/reset()/setHighlightArea(newHighlightArea)
    if(!isNullOrUndefined(this.props.control))
    {
      this.props.control({highlightAll: () => this.highlightAll(),
                          reset: () => this.reset(),
                          setHighlightArea: (newHighlightArea) => this.setHighlightArea(newHighlightArea)});
    }
  }

  componentWillReceiveProps(nextProps) {
    const {highlightHeight,
      highlightWidth,
      innerWidth,
      innerHeight,
      marginLeft,
      marginBottom,
      marginTop,
      marginRight,
      onBrushEnd,
      newHighlightArea} = nextProps;

      if(!isUndefined(newHighlightArea) && newHighlightArea !== this.props.newHighlightArea)
      {
        const xScale = getAttributeScale(this.props, 'x');
        const yScale = getAttributeScale(this.props, 'y');

        const plotHeight = innerHeight + marginTop + marginBottom;
        const plotWidth = innerWidth + marginLeft + marginRight;

        let bottomPos = highlightHeight || plotHeight;
        if(!isNullOrUndefined(newHighlightArea.bottom)) {
          bottomPos = yScale(newHighlightArea.bottom) + marginTop
        }
        let topPos = 0 
        if(!isNullOrUndefined(newHighlightArea.top)){
          topPos = yScale(newHighlightArea.top) + marginTop
        }
        let leftPos = 0 + marginLeft;
        if (!isNullOrUndefined(newHighlightArea.left)) {
          leftPos = xScale(newHighlightArea.left) + marginLeft;
        }
        let rightPos = highlightWidth || plotWidth;
        if(!isNullOrUndefined(newHighlightArea.right)) {
          rightPos = xScale(newHighlightArea.right) + marginLeft;
        }

        const brushArea = {
          bottom: bottomPos,
          right: rightPos,
          left: leftPos,
          top: topPos
        };

        const noHorizontal = Math.abs(brushArea.right - brushArea.left) < 5;
        const noVertical = Math.abs(brushArea.top - brushArea.bottom) < 5;
        // Invoke the callback with null if the selected area was < 5px
        const isNulled = noVertical || noHorizontal;

        this.setState({brushArea, dragArea: brushArea});
        onBrushEnd(!isNulled ? this._convertAreaToCoordinates(brushArea) : null);
      }
  }

  reset() {
    const {onBrushEnd} = this.props;
    const brushArea = {top: 0, right: 0, bottom: 0, left: 0};
    this.setState({brushArea, dragArea: brushArea});

    onBrushEnd(null);
  }

  highlightAll() {
    const {highlightHeight,
      innerWidth,
      innerHeight,
      marginLeft,
      marginBottom,
      marginTop,
      marginRight,
      onBrushEnd} = this.props;

    const plotHeight = innerHeight + marginTop + marginBottom;
    const touchHeight = highlightHeight || plotHeight;

    const brushArea = {
      bottom: touchHeight,
      right: innerWidth + marginLeft - marginRight,
      left: 0 + marginLeft,
      top: 0
    };

    const noHorizontal = Math.abs(brushArea.right - brushArea.left) < 5;
    const noVertical = Math.abs(brushArea.top - brushArea.bottom) < 5;
    // Invoke the callback with null if the selected area was < 5px
    const isNulled = noVertical || noHorizontal;

    this.setState({brushArea, dragArea: brushArea});
    onBrushEnd(!isNulled ? this._convertAreaToCoordinates(brushArea) : null);
    
  }

  setHighlightArea(newHighlightArea) {
    const {highlightHeight,
      highlightWidth,
      innerWidth,
      innerHeight,
      marginLeft,
      marginBottom,
      marginTop,
      marginRight,
      onBrushEnd} = this.props;
    
    const xScale = getAttributeScale(this.props, 'x');
    const yScale = getAttributeScale(this.props, 'y');

    const plotHeight = innerHeight + marginTop + marginBottom;
    const plotWidth = innerWidth + marginLeft + marginRight;

    let bottomPos = highlightHeight || plotHeight;
    if(!isNullOrUndefined(newHighlightArea.bottom)) {
      bottomPos = yScale(newHighlightArea.bottom) + marginTop;
    }
    let topPos = 0 
    if(!isNullOrUndefined(newHighlightArea.top)){
      topPos = yScale(newHighlightArea.top) + marginTop;
    }
    let leftPos = 0 + marginLeft;
    if (!isNullOrUndefined(newHighlightArea.left)) {
      leftPos = xScale(newHighlightArea.left) + marginLeft;
    }
    let rightPos = highlightWidth || plotWidth;
    if(!isNullOrUndefined(newHighlightArea.right)) {
      rightPos = xScale(newHighlightArea.right) + marginLeft;
    }

    const brushArea = {
      bottom: bottomPos,
      right: rightPos,
      left: leftPos,
      top: topPos
    };

    const noHorizontal = Math.abs(brushArea.right - brushArea.left) < 5;
    const noVertical = Math.abs(brushArea.top - brushArea.bottom) < 5;
    // Invoke the callback with null if the selected area was < 5px
    const isNulled = noVertical || noHorizontal;

    this.setState({brushArea, dragArea: brushArea});
    onBrushEnd(!isNulled ? this._convertAreaToCoordinates(brushArea) : null);
  }

  _getDrawArea(xLoc, yLoc) {
    const {startLocX, startLocY} = this.state;
    const {
      enableX,
      enableY,
      highlightWidth,
      highlightHeight,
      innerWidth,
      innerHeight,
      marginLeft,
      marginRight,
      marginBottom,
      marginTop
    } = this.props;
    const plotHeight = innerHeight + marginTop + marginBottom;
    const plotWidth = innerWidth + marginLeft + marginRight;
    const touchWidth = highlightWidth || plotWidth;
    const touchHeight = highlightHeight || plotHeight;

    return {
      bottom: enableY ? Math.max(startLocY, yLoc) : touchHeight,
      right: enableX ? Math.max(startLocX, xLoc) : touchWidth,
      left: enableX ? Math.min(xLoc, startLocX) : 0,
      top: enableY ? Math.min(yLoc, startLocY) : 0
    };
  }

  _getDragArea(xLoc, yLoc) {
    const {enableX, enableY} = this.props;
    const {startLocX, startLocY, dragArea} = this.state;

    return {
      bottom: dragArea.bottom + (enableY ? yLoc - startLocY : 0),
      left: dragArea.left + (enableX ? xLoc - startLocX : 0),
      right: dragArea.right + (enableX ? xLoc - startLocX : 0),
      top: dragArea.top + (enableY ? yLoc - startLocY : 0)
    };
  }

  _clickedOutsideDrag(xLoc, yLoc) {
    const {enableX, enableY} = this.props;
    const {
      dragArea,
      brushArea: {left, right, top, bottom}
    } = this.state;
    const clickedOutsideDragX = dragArea && (xLoc < left || xLoc > right);
    const clickedOutsideDragY = dragArea && (yLoc < top || yLoc > bottom);
    if (enableX && enableY) {
      return clickedOutsideDragX || clickedOutsideDragY;
    }
    if (enableX) {
      return clickedOutsideDragX;
    }
    if (enableY) {
      return clickedOutsideDragY;
    }
    return true;
  }

  _convertAreaToCoordinates(brushArea) {
    // NOTE only continuous scales are supported for brushing/getting coordinates back
    const {enableX, enableY, marginLeft, marginTop} = this.props;
    const xScale = getAttributeScale(this.props, 'x');
    const yScale = getAttributeScale(this.props, 'y');

    // Ensure that users wishes are being respected about which scales are evaluated
    // this is specifically enabled to ensure brushing on mixed categorical and linear
    // charts will run as expected

    if (enableX && enableY) {
      return {
        bottom: yScale.invert(brushArea.bottom),
        left: xScale.invert(brushArea.left - marginLeft),
        right: xScale.invert(brushArea.right - marginLeft),
        top: yScale.invert(brushArea.top)
      };
    }

    if (enableY) {
      return {
        bottom: yScale.invert(brushArea.bottom - marginTop),
        top: yScale.invert(brushArea.top - marginTop)
      };
    }

    if (enableX) {
      return {
        left: xScale.invert(brushArea.left - marginLeft),
        right: xScale.invert(brushArea.right - marginLeft)
      };
    }

    return {};
  }

  startBrushing(e) {
    const {onBrushStart, onDragStart, drag} = this.props;
    const {dragArea} = this.state;
    const {xLoc, yLoc} = getLocs(e.nativeEvent);

    const startArea = (dragging, resetDrag) => {
      const emptyBrush = {
        bottom: yLoc,
        left: xLoc,
        right: xLoc,
        top: yLoc
      };
      this.setState({
        dragging,
        brushArea: dragArea && !resetDrag ? dragArea : emptyBrush,
        brushing: !dragging,
        startLocX: xLoc,
        startLocY: yLoc
      });
    };

    const clickedOutsideDrag = this._clickedOutsideDrag(xLoc, yLoc);
    if ((drag && !dragArea) || !drag || clickedOutsideDrag) {
      startArea(false, clickedOutsideDrag);

      if (onBrushStart) {
        onBrushStart(e);
      }
      return;
    }

    if (drag && dragArea) {
      startArea(true, clickedOutsideDrag);
      if (onDragStart) {
        onDragStart(e);
      }
    }
  }

  stopBrushing(e) {
    const {brushing, dragging, brushArea} = this.state;
    // Quickly short-circuit if the user isn't brushing in our component
    if (!brushing && !dragging) {
      return;
    }
    const {onBrushEnd, onDragEnd, drag} = this.props;
    const noHorizontal = Math.abs(brushArea.right - brushArea.left) < 5;
    const noVertical = Math.abs(brushArea.top - brushArea.bottom) < 5;
    // Invoke the callback with null if the selected area was < 5px
    const isNulled = noVertical || noHorizontal;
    // Clear the draw area
    this.setState({
      brushing: false,
      dragging: false,
      brushArea: drag ? brushArea : {top: 0, right: 0, bottom: 0, left: 0},
      startLocX: 0,
      startLocY: 0,
      dragArea: drag && !isNulled && brushArea
    });

    if (brushing && onBrushEnd) {
      onBrushEnd(!isNulled ? this._convertAreaToCoordinates(brushArea) : null);
    }

    if (drag && onDragEnd) {
      onDragEnd(!isNulled ? this._convertAreaToCoordinates(brushArea) : null);
    }
  }

  onBrush(e) {
    const {onBrush, onDrag, drag} = this.props;
    const {brushing, dragging} = this.state;
    const {xLoc, yLoc} = getLocs(e.nativeEvent);
    if (brushing) {
      const brushArea = this._getDrawArea(xLoc, yLoc);
      this.setState({brushArea});

      if (onBrush) {
        onBrush(this._convertAreaToCoordinates(brushArea));
      }
    }

    if (drag && dragging) {
      const brushArea = this._getDragArea(xLoc, yLoc);
      this.setState({brushArea});
      if (onDrag) {
        onDrag(this._convertAreaToCoordinates(brushArea));
      }
    }
  }

  render() {
    const {
      color,
      className,
      highlightHeight,
      highlightWidth,
      highlightX,
      highlightY,
      innerWidth,
      innerHeight,
      marginLeft,
      marginRight,
      marginTop,
      marginBottom,
      opacity
    } = this.props;
    const {
      brushArea: {left, right, top, bottom}
    } = this.state;

    let leftPos = 0;
    if (highlightX) {
      const xScale = getAttributeScale(this.props, 'x');
      leftPos = xScale(highlightX);
    }

    let topPos = 0;
    if (highlightY) {
      const yScale = getAttributeScale(this.props, 'y');
      topPos = yScale(highlightY);
    }

    const plotWidth = marginLeft + marginRight + innerWidth;
    const plotHeight = marginTop + marginBottom + innerHeight;
    const touchWidth = highlightWidth || plotWidth;
    const touchHeight = highlightHeight || plotHeight;

    return (
      <g
        transform={`translate(${leftPos}, ${topPos})`}
        className={`${className} rv-highlight-container`}
      >
        <rect
          className="rv-mouse-target"
          fill="black"
          opacity="0"
          x="0"
          y="0"
          width={Math.max(touchWidth, 0)}
          height={Math.max(touchHeight, 0)}
          onMouseDown={e => this.startBrushing(e)}
          onMouseMove={e => this.onBrush(e)}
          onMouseUp={e => this.stopBrushing(e)}
          onMouseLeave={e => this.stopBrushing(e)}
          // preventDefault() so that mouse event emulation does not happen
          onTouchEnd={e => {
            e.preventDefault();
            this.stopBrushing(e);
          }}
          onTouchCancel={e => {
            e.preventDefault();
            this.stopBrushing(e);
          }}
          onContextMenu={e => e.preventDefault()}
          onContextMenuCapture={e => e.preventDefault()}
        />
        <rect
          className="rv-highlight"
          pointerEvents="none"
          opacity={opacity}
          fill={color}
          x={left}
          y={top}
          width={Math.min(Math.max(0, right - left), touchWidth)}
          height={Math.min(Math.max(0, bottom - top), touchHeight)}
        />
      </g>
    );
  }
}

Highlight.displayName = 'HighlightOverlay';
Highlight.defaultProps = {
  color: 'rgb(77, 182, 172)',
  className: '',
  enableX: true,
  enableY: true,
  opacity: 0.3
};

Highlight.propTypes = {
  ...AbstractSeries.propTypes,
  enableX: PropTypes.bool,
  enableY: PropTypes.bool,
  highlightHeight: PropTypes.number,
  highlightWidth: PropTypes.number,
  highlightX: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  highlightY: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onBrushStart: PropTypes.func,
  onDragStart: PropTypes.func,
  onBrush: PropTypes.func,
  onDrag: PropTypes.func,
  onBrushEnd: PropTypes.func,
  onDragEnd: PropTypes.func
};

export default Highlight;
