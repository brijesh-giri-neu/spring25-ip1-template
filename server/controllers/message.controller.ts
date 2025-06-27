import express, { Response, Request } from 'express';
import { FakeSOSocket } from '../types/socket';
import { AddMessageRequest, Message } from '../types/types';
import { saveMessage, getMessages } from '../services/message.service';

const messageController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Checks if the provided message request contains the required fields.
   *
   * @param req The request object containing the message data.
   *
   * @returns `true` if the request is valid, otherwise `false`.
   */
  const isRequestValid = (req: AddMessageRequest): boolean => {
    const { messageToAdd } = req.body || {};
    return messageToAdd && typeof messageToAdd === 'object';
  };

  /**
   * Validates the Message object to ensure it contains the required fields.
   *
   * @param message The message to validate.
   *
   * @returns `true` if the message is valid, otherwise `false`.
   */
  const isMessageValid = (message: Message): boolean => {
    return (
      typeof message.msg === 'string' &&
      message.msg.trim() !== '' &&
      typeof message.msgFrom === 'string' &&
      message.msgFrom.trim() !== ''
    );
  };

  /**
   * Handles adding a new message. The message is first validated and then saved.
   * If the message is invalid or saving fails, the HTTP response status is updated.
   *
   * @param req The AddMessageRequest object containing the message and chat data.
   * @param res The HTTP response object used to send back the result of the operation.
   *
   * @returns A Promise that resolves to void.
   */
  const addMessageRoute = async (req: AddMessageRequest, res: Response): Promise<void> => {
    if (!isRequestValid(req)) {
      res.status(400).json({ error: 'Invalid request' });
      return;
    }

    const { messageToAdd } = req.body;
    if (!isMessageValid(messageToAdd)) {
      res.status(400).json({ error: 'Invalid message' });
      return;
    }

    const result = await saveMessage(messageToAdd);
    if ('error' in result) {
      res.status(400).json(result);
    } else {
      socket.emit('messageUpdate', { msg: result });
      res.status(200).json(result);
    }
  };

  /**
   * Fetch all messages in descending order of their date and time.
   * @param req The request object.
   * @param res The HTTP response object used to send back the messages.
   * @returns A Promise that resolves to void.
   */
  const getMessagesRoute = async (req: Request, res: Response): Promise<void> => {
    const messages = await getMessages();
    res.status(200).json(messages);
  };

  // Add appropriate HTTP verbs and their endpoints to the router
  router.post('/addMessage', addMessageRoute);
  router.get('/getMessages', getMessagesRoute);

  return router;
};

export default messageController;
