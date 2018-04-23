class CommandParser {
    private seq: number = 0;
    private _option: IConnectOption;

    constructor(option: IConnectOption) {
        this._option = option;
        this.seq = 0;
    }

    decode(buf: ArrayBuffer): Uint8Array {
        let src = new Uint8Array(buf, 0, buf.byteLength);
        let dst = new Uint8Array(src.length);
        let j = 0;
        for (let i = 0; i < src.length; i++) {
            if (src[i] == 0x5E)
                dst[j++] = ~src[++i];
            else
                dst[j++] = src[i];
        }
        return dst.subarray(0, j);
    }

    doReply(message: ReplyMessage) {
        switch (message.commandNo) {
            case 0x0001:
                {
                    if (this._option.onlogin) {
                        this._option.onlogin(message.result === 0);
                    }
                    break;
                }
            default:
                {
                    if (this._option.onCommonReply) {
                        this._option.onCommonReply(message);
                    }
                }
        }
    }

    parse(buf: ArrayBuffer) {
        let ibuf = this.decode(buf);
        let istream = new BufferReader(ibuf);
        istream.readUint8();
        let cmd = istream.readUint16();
        let seq = istream.readUint16();
        let len = istream.readUint16();
        let message: ReplyMessage = new ReplyMessage();
        switch (cmd) {
            case 0x0003: //应答
                {
                    message.seq = istream.readUint16();
                    message.commandNo = istream.readUint16();
                    message.result = istream.readUint8();
                    this.doReply(message);
                    break;
                }
            case 0x8000:
                {
                    let subcmd = istream.readUint16();
                    let tcount = istream.readUint8();
                    let tids: string[] = [];
                    for (let i = 0; i < tcount; i++)
                        tids.push(istream.readn(6).toString(16));
                    switch (subcmd) {
                        case 0xFF03:
                            {
                                message.commandNo = istream.readUint16();
                                message.seq = istream.readUint16();
                                message.terminalCommandNo = istream.readInt16();
                                message.result = istream.readInt32();
                                if (this._option.onSendReply) {
                                    this._option.onSendReply(tids, message);
                                }
                                break;
                            }
                        case 0xFF04:
                            {
                                message.seq = istream.readInt16();
                                message.commandNo = istream.readUint16();
                                message.result = istream.readUint16();
                                message.desciption = istream.readString();
                                if (this._option.onTerminalReply) {
                                    this._option.onTerminalReply(tids, message);
                                }
                                break;
                            }
                        case 0xFF05:
                            {
                                let n = istream.readUint16();
                                let datas: TerminalData[] = [];
                                for (let i = 0; i < n; i++) {
                                    datas.push(new TerminalData(istream.readUint32(),
                                        istream.readUint8(), istream.readString()));
                                };

                                if (this._option.onRecvTerminalData) {
                                    this._option.onRecvTerminalData(tids, datas);
                                }
                                break;
                            }
                    }
                    break;
                }
            case 0x9000:
                {
                    break;
                }
            default:
                return;
        }
    }

    encode(cmd: number, buf: Uint8Array): Uint8Array {
        let stream = new BufferWriter(buf.byteLength + 50);
        stream.writeUint8(0x7B)
            .writeUint16(cmd)
            .writeUint16(this.seq++)
            .writeUint16(buf.byteLength)
            .writeBuffer(buf, buf.byteLength);
        let src = stream.getBuffer();
        let c = 0;
        for (let i = 1; i < src.byteLength; i++) {
            c ^= src[i];
        }
        stream.writeInt8(c)
            .writeUint8(0x7D);
        return stream.getBuffer();
    }

    parseNetworkID(v: any) {
        let arr;
        if (typeof v === "string") {
            arr = [parseInt(v, 16)];
        }
        else if (typeof v === "number") {
            arr = [v];
        }
        else {
            arr = v;
        }
        return arr;
    }

    writeParam(stream: BufferWriter, param: CustomerData, writeType: boolean) {
        if (writeType)
            stream.writeUint8(param.dataType);
        switch (param.dataType) {
            case 1: //BYTE
                {
                    stream.writeUint8(param.value);
                    break;
                }
            case 2: //WORD
                {
                    stream.writeUint16(param.value);
                    break;
                }
            case 3: //DWORD
                {
                    stream.writeUint32(param.value);
                    break;
                }
            case 4: //STRING
                {
                    stream.writeString(param.value);
                    break;
                }
            case 7://DATETIME
                {
                    let v = param.value
                    if (typeof param.value == "string")
                        v = new Date(param.value);
                    stream.writeUint8(v.getFullYear() - 2000)
                        .writeUint8(v.getMonth() + 1)
                        .writeUint8(v.getDate())
                        .writeUint8(v.getHours())
                        .writeUint8(v.getMinutes())
                        .writeUint8(v.getSeconds());
                    break;
                }
        }
    }

    output(commandNo: number, body: any[]) {
        let stream = new BufferWriter(1024);
        switch (commandNo) {
            case 0x0001://登录
                {
                    stream.writeString(body[0])
                        .writeString(body[1]);
                    break;
                }
            case 0x0002: //连接测试
                break;
            case 0x8000:
                {
                    let ids = this.parseNetworkID(body[0]);
                    let subCommandNo = body[1];
                    stream.writeUint16(subCommandNo)
                        .writeUint8(ids.length);
                    for (let i in ids) {
                        stream.writen(ids[i], 6);
                    }
                    switch (subCommandNo) {
                        case 0xFF00:
                            {
                                let flag = body[2] ? body[2] : 0;
                                stream.writeUint16(flag);
                                break;
                            }
                        case 0xFF01:
                            {
                                break;
                            }
                        default:
                            {
                                let arrArgs = body[2];
                                for (let arg in arrArgs) {
                                    this.writeParam(stream, arrArgs[arg], false);
                                }
                                break;
                            }
                    }
                    break;
                }
            case 0x9000:
                {
                    let ids = this.parseNetworkID(body[0]);
                    let subCommandNo = body[1];
                    stream.writeUint8(1)
                        .writeUint16(subCommandNo)
                        .writeUint8(ids.length);
                    for (let i in ids) {
                        stream.writen(ids[i], 6);
                    }
                    let arrArgs = body[2];
                    for (let arg in arrArgs) {
                        this.writeParam(stream, arrArgs[arg], true);
                    }
                    break;
                }
            default:
                break;
        }
        return this.encode(commandNo, stream.getBuffer());
    }
}