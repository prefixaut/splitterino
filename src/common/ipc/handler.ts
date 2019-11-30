import { Observable, Subscription } from 'rxjs';
import { Store } from 'vuex';
import { Publisher, Subscriber } from 'zeromq';

import { RootState } from '../../store/states/root.state';
import { Message, Request, MessageType, Response } from '../interfaces/ipc';
import { Logger } from '../../utils/logger';
import { filter, first } from 'rxjs/operators';

export abstract class IPCHandler {
    protected address = 'tcp://127.0.0.1:3730';

    protected sender: Publisher;
    protected listener: Observable<Message>;

    protected rxSubscription: Subscription;

    public abstract handleIncomingMessage(message: Message): any;

    public async initialize(): Promise<Subscription> {
        this.sender = new Publisher();
        await this.sender.bind(this.address);

        this.listener = new Observable<Message>(rxSubscriber => {
            const zmqSubscriber = new Subscriber();
            zmqSubscriber.connect(this.address);

            function waitForNext() {
                zmqSubscriber.receive()
                    .then(data => {
                        try {
                            rxSubscriber.next(JSON.parse(data.toString()));
                            waitForNext();
                        } catch (err) {
                            rxSubscriber.error(err);
                        }
                    });
            }
            waitForNext();

            return async () => {
                await zmqSubscriber.unbind(this.address);
                zmqSubscriber.close();
            };
        });

        this.rxSubscription = this.listener.subscribe(message => {
            Logger.debug({
                msg: 'Received IPC Message',
                ipcMessage: message,
            });

            this.handleIncomingMessage(message);
        });

        return this.rxSubscription;
    }

    protected sendMessage(message: Message) {
        Logger.debug({
            msg: 'Sending IPC Message',
            ipcMessage: message,
        });

        this.sender.send(JSON.stringify(message));
    }

    protected async sendRequestAwaitResponse(request: Request, responseType: MessageType): Promise<Response> {
        this.sendMessage(request);

        const response = await this.listener.pipe(
            filter(message => {
                return message.type === responseType && (message as Response).respondsTo === request.id;
            }),
            first()
        ).toPromise() as Response;

        if (!response.successful) {
            throw response.error;
        }

        return response;
    }
}
