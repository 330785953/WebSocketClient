class WebSocketService {

    private _option: IConnectOption;
    private _parser: CommandParser;
    private _socket: WebSocket;
    private timerToken: number;

    constructor(option: IConnectOption) {
        this._option = option;
        this.connect();
    }

    get isConnected(): boolean {
        return this._socket && this._socket.readyState == WebSocket.OPEN;
    }

    connect() {
        if (this._option) {
            this._parser = new CommandParser(this._option);
        }
        this.init();
    }

    init() {
        if (!this._option.address) {
            return;
        }

        this.close();
        this._socket = new WebSocket(this._option.address);
        this._socket.binaryType = "arraybuffer";

        this.timerToken = setInterval(() => {
            if (this._socket && this._socket.readyState > 1) {
                //重连
                this.connect();
            }
            else {
                this.sendHeartBeat();
            }
        }, 5000);

        this._socket.onopen = () => {
            this.fireEvent("onopen");
            if (this._option.userName && this._option.password) {
                this.login(this._option.userName, this._option.password);
            }
        }

        this._socket.onmessage = (event) => {
            this._parser.parse(event.data)
        }

        this._socket.onerror = (e) => {
            this.fireEvent("onerror", e);
        }

        this._socket.onclose = () => {
            this.fireEvent("onclose");
        }
    }

    fireEvent(event: string, args?: any) {
        if (this._option[event]) {
            this._option[event].apply(this, args)
        }
    }

    login(user: string, pwd: string) {
        return this.sendCommand(0x0001, [user, pwd]);
    }

    sendHeartBeat() {
        return this.sendCommand(0x0002);
    }

    close() {
        if (this._socket && this._socket.readyState <= 1)
            this._socket.close();
        if (this.timerToken)
            clearInterval(this.timerToken);
    }

    sendCommand(commandNo: number, body?: any[]): boolean {
        if (!this.isConnected)
            return false;

        let buffer = this._parser.output(commandNo, body);
        if (buffer) {
            this._socket.send(buffer);
        }
        return true;
    }

    sendCommonCommand(...body: any[]): boolean {
        return this.sendCommand(0x8000, body);
    }

    sendCustomCommand(...body: any[]): boolean {
        return this.sendCommand(0x9000, body);
    }

    //点名 | 取消点名
    subscribe(ids: string, flag?: number): boolean {
        return this.sendCommonCommand(ids, 0xFF00, flag || 0);
    }

    unsubscribe(ids: string): boolean {
        return this.sendCommonCommand(ids, 0xFF01);
    }
}

