import { getSuggestedQuery, waitFor } from '@testing-library/react';
import { wait } from '@testing-library/user-event/dist/utils';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

class Square extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: props.value,
            fixed: props.fixed
        };
        this.inputRef = React.createRef();
    }

    onChange(event) {
        //this.setState({value: event.target.value});
        let newVal = event.target.value;
        // if longer than 1 char, set to last char
        if (newVal.length > 1) {
            newVal = newVal[newVal.length - 1];
        }
        const valid = /^[1-9]$/.test(newVal);
        let value = this.state.value;
        let fixed = this.state.fixed;
        if (valid) {
            value = parseInt(newVal);
            fixed = true;
        }
        else if (newVal === "") {
            value = 0;
            fixed = false;
        }
        else {
            if (this.state.fixed) {
                this.inputRef.current.value = this.state.value;
            } else {
                this.inputRef.current.value = "";
            }
        }

        // check if values changed
        if (value !== this.state.value || fixed !== this.state.fixed) {
            this.setState({ value: value });
            this.setState({ fixed: fixed });
            this.props.update(this.props.x, this.props.y, value, fixed);
            //console.log("updated (" + this.props.x + ", " + this.props.y + ") to " + value + " fixed: " + fixed);
            //console.log(this);
        }

    }

    change(value, fixed) {
        this.setState({ value: value });
        this.setState({ fixed: fixed });
    }

    clear() {
        this.setState({ value: 0 });
        this.setState({ fixed: false });
    }

    reset() {
        if (!this.state.fixed) {
            this.setState({ value: 0 });
        }
    }

    isGray() {
        let xArea = Math.floor(this.props.x / 3);
        let yArea = Math.floor(this.props.y / 3);
        return (xArea + yArea) % 2 !== 0;
    }

    render() {
        var className = this.isGray() ? "square gray" : "square";
        if (!this.state.fixed) {
            className += " solved";
        }
        var t = "";
        if (this.state.value !== 0) {
            t = this.state.value;
        }
        return (
            <input type="text" value={t} className={className} onChange={(e) => this.onChange(e)} ref={this.inputRef} key={this.props.y} />
        );
    }
}


    

class Board extends React.Component {

    constructor(props) {
        super(props);
        this.checks = 0;

        this.state = {
            squares: Array(9).fill(null),
            lulw: "Enter the numbers"
        };

        for (let i = 0; i < 9; i++) {
            this.state.squares[i] = Array(9).fill(null);
            for (let j = 0; j < 9; j++) {
                this.state.squares[i][j] = { x: i, y: j, value: 0, fixed: false, update: this.onSquareChange.bind(this), ref: React.createRef() };
            }
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    onSquareChange(x, y, value, fixed) {
        let a = this.state.squares;
        a[x][y].value = value;
        a[x][y].fixed = fixed;
        this.setState({ squares: a });
    }

    onReset() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (!this.state.squares[i][j].fixed) {
                    this.state.squares[i][j].value = 0;
                    this.state.squares[i][j].ref.current.reset();
                }
            }
        }
    }

    onClear() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                this.state.squares[i][j].value = 0;
                this.state.squares[i][j].fixed = false;
                this.state.squares[i][j].ref.current.clear();
            }
        }
    }

    getSquare(x, y) {
        return this.state.squares[x][y];
    }

    checkBoard() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.state.squares[i][j].value !== 0 && !this.checkOne(i, j)) {
                    return false;
                }
            }
        }
        return true;
    }

    checkBoard2() {
        const fs = [
            // lambda for rows
            (i) => {
                let sum = 0;
                for (let j = 0; j < 9; j++) {
                    var x = this.getSquare(i, j).value;
                    var sq = x ? 1 << x : 0;
                    if (sum & sq) return false;
                    sum |= sq;
                }
                return true;
            },
            // lambda for cols
            (i) => {
                let sum = 0;
                for (let j = 0; j < 9; j++) {
                    var x = this.getSquare(j, i).value;
                    var sq = x ? 1 << x : 0;
                    if (sum & sq) return false;
                    sum |= sq;
                }
                return true;
            },
            // lambda for squares
            (i) => {
                let sum = 0;
                for (let j = 0; j < 9; j++) {
                    var x = this.getSquare(Math.floor(i / 3) * 3 + Math.floor(j / 3), (i % 3) * 3 + j % 3).value;
                    var sq = x ? 1 << x : 0;
                    if (sum & sq) return false;
                    sum |= sq;
                }
                return true;
            }
        ];
        for (let f of fs) {
            for (let j = 0; j < 9; j++) {
                if (!f(j)) {
                    return false;
                }
            }

        }
        return true;
    }

    checkOne(row, col) {
        this.checks++;
        if (this.checks % 1000000 === 0) {
            console.log( Math.floor(this.checks / 1000000) + "M checks");
        }
        //check row
        for (let i = 0; i < 9; i++) {
            if (i !== col && this.getSquare(row, i).value === this.getSquare(row, col).value) {
                return false;
            }
        }
        //check col
        for (let i = 0; i < 9; i++) {
            if (i !== row && this.getSquare(i, col).value === this.getSquare(row, col).value) {
                return false;
            }
        }
        //check square
        let xArea = Math.floor(row / 3);
        let yArea = Math.floor(col / 3);
        for (let i = xArea * 3; i < xArea * 3 + 3; i++) {
            for (let j = yArea * 3; j < yArea * 3 + 3; j++) {
                if (i !== row && j !== col && this.getSquare(i, j).value === this.getSquare(row, col).value) {
                    return false;
                }
            }
        }
        return true;

    }

    solve(i) {
        let row = Math.floor(i / 9);
        let col = i % 9;
        if (row === 9) {
            return true;
        }
        let square = this.getSquare(row, col);
        if (square.value === 0) {
            for (let j = 1; j <= 9; j++) {
                square.value = j;
                if (this.checkBoard2()) {
                    if (true) {
                        //await this.sleep(10);
                    }
                    square.ref.current.change(j, false);
                    if (this.solve(i + 1)) {
                        return true;
                    }
                }
            }

            square.value = 0;
            square.ref.current.reset();
            return false;
        }
        else {
            return this.solve(i + 1);
        }
    }

    onSolve() {
        // lulw to Solving...
        this.setState({ lulw: "Solving..." });
        this.checks = 0;
        // reset all squares
        this.onReset();

        let start = 0;
        let t = performance.now();
        let success = this.solve(start);
        if (success) {
            this.setState({ lulw: "Solved!" });
            console.log("Solved in " + (performance.now() - t) + "ms");
        } else {
            this.setState({ lulw: "No solution found" });
        }


    }

    render() {
        const status = 'Enter the numbers';
        const code = [];
        for (let i = 0; i < 9; i++) {
            let row = [];
            for (let j = 0; j < 9; j++) {
                let p = this.getSquare(i, j);
                row.push(<Square key={j} x={i} y={j} value={p.value} fixed={p.fixed} update={p.update} ref={p.ref} />);
            }
            code.push(<div className="board-row" key={i}> {row} </div>);
        }

        return (
            <div>
                <div className="status">{this.state.lulw}</div>
                {code}
                <button onClick={() => this.onSolve()}>Solve</button>
                <button onClick={() => this.onReset()}>Reset</button>
                <button onClick={() => this.onClear()}>Clear</button>

            </div>
        );


    }
}


class Game extends React.Component {
    render() {
        return (
            <div className="game">
                <div className="game-board">
                    <Board />
                </div>
                <div className="game-info">
                    <div>{/* status */}</div>
                    <ol>{/* TODO */}</ol>
                </div>
            </div>
        );
    }
}

// ========================================

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Game />);