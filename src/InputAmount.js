import React, {Component} from "react";
import { Form } from "react-bootstrap";

function isDigit(c) {
  return c >= '0' && c <= '9';
}

export default class InputAmount extends Component{
  state = {
    selection: {start: 0, end: 0},
    value: "",
    fixSelection: null,
    skipOnChange: false
  };
  inputRef = React.createRef();

  getNormalizedValue(value) {
    return value.split(',').join('').split('.', 2).join('.');
  }

  static getFormattedValue(value, maxFractionLength = 3) {
    let parts = value.split('.', 2);
    let fraction = parts.length === 2 ? "." + parts[1] : "";
    let int = parts[0];
    let cnt = 0;
    for(let i = int.length - 1; i >= 0; i--) {
      if (cnt === 3 && int[i] === ',' && i > 0) {
        cnt = 0;
        continue;
      }
      if (cnt === 3 && isDigit(int[i])){
        int = [int.slice(0, i+1), int.slice(i+1)].join(',');
        cnt = 1;
        continue;
      }
      if ((cnt !== 3 || i == 0) && int[i] === ',') {
        int = [int.slice(0, i), int.slice(i+1)].join('');
        continue;
      }
      if (isDigit(int[i])) {
        cnt++;
        continue;
      }
      if (int[i] !== '|') {
        int = [int.slice(0, i), int.slice(i+1)].join('');
        continue;
      }
    }
    while (int.split('|').join('').length > 1 && (int[0] === '0' || int[0] === ',')) int = int.slice(1);
    fraction = Array.from(fraction).filter(c => c === '.' || isDigit(c)).join('').slice(0, maxFractionLength);
    return int + fraction;
  }

  handleSelectionChange = (e) => {
    const {selection} = e.nativeEvent;
    if (this.state.fixSelection) {
      this.setState({fixSelection: false});
      return;
    }

    this.setState({selection});
  };

  handleTextChange = (event) => {
    if (!event?.nativeEvent?.target) return;
    const text = event.nativeEvent.target.value;
    if (this.state.skipOnChange) {
      this.setState({skipOnChange: false});
      return
    }
    const text2 = [text.slice(0, this.state.selection.end+1), '|', text.slice(this.state.selection.end+1)].join('');
    const formatted = InputAmount.getFormattedValue(text2, this.props.maxFractionLength);
    const newSelection = Math.max(0, formatted.indexOf("|"));
    const value = formatted.split('|').join('');
    this.setState({value});
    if (text !== value) {
      const selection = {
        start: newSelection,
        end: newSelection,
      };
      this.setState({selection, fixSelection: true});
    }
    this.props.onChangeText && this.props.onChangeText(this.getNormalizedValue(value));
  };

  handleKeyPress = (event) => {
    if (event.nativeEvent.key === ',') {
      const {value} = this.state;
      const {start, end} = this.state.selection;
      const newValue = [value.slice(0, this.state.selection.start), '.', value.slice(this.state.selection.end)].join('');
      this.handleTextChange(newValue);
      this.setState({skipOnChange: true});
      setTimeout(() => {
        this.setState({skipOnChange: false});
      }, 1);
    }
  }

  render() {
    return (
        <Form.Control
        value={this.state.value}
        onKeyPress={this.handleKeyPress}
        onSelectionChange={this.handleSelectionChange}
        maxLength={this.props.maxLength}
        selectionColor={this.props.selectionColor}
        style={this.props.style}
        ref={this.inputRef}
        onChange={this.handleTextChange}
        placeholder={this.props.placeholder}
        autoComplete="off"
        id="inlineFormInputGroup" 
        />
        )
  }

  static getDerivedStateFromProps(props, state) {
    if (state.value !== props.value) {
      if (typeof props.value !== 'string') {
        console.warn('Expected string value', props.value);
        return null;
      }
      return {value: InputAmount.getFormattedValue(props.value, props.maxFractionLength)};
    }
    return null;
  }
}
