interface IConnectOption {
    address: string;
    userName: string;
    password: string;

    onopen: () => any;
    onclose: () => any;
    onlogin: (isSuccess: boolean) => any;
    onSendReply: (communicationNos: string[], message: ReplyMessage) => any;
    onCommonReply: (message: ReplyMessage) => any;
    onTerminalReply: (communicationNos: string[], message: ReplyMessage) => any;
    onRecvTerminalData: (communicationNos: string[], datas: TerminalData[]) => any;
}


class ReplyMessage {
    seq: number;
    commandNo: number;
    terminalCommandNo: number;
    result: number;
    desciption: string;
}

class TerminalData {
    constructor(id: number, type: number, value: string) {
        this.id = id;
        this.type = type;
        this.value = value;
    }
    id: number;
    type: number;
    value: string;
}

class CustomerData {
    dataType: number;
    value: any;
}