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
    // We need type checks because req.body comes from external,
    // untyped sources like HTTP requests, which TypeScript cannot enforce at runtime.
    const { messageToAdd } = req.body;
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
    // We need type checks because req.body comes from external,
    // untyped sources like HTTP requests, which TypeScript cannot enforce at runtime.
    return (
      typeof message.msg === 'string' &&
      message.msg.trim() !== '' &&
      typeof message.msgFrom === 'string' &&
      message.msgFrom.trim() !== '' &&
      message.msgDateTime instanceof Date && !isNaN(message.msgDateTime.getTime())  // Verify that msgDateTime is a valid Date object
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
      res.status(400).send('Invalid request');
      return;
    }

    // Deserialized as a raw string by express server
    const rawMessage = req.body.messageToAdd;

    // Need to manually parse msgDateTime to a Date object 
    // because it is deserialized as a raw string by express server
    const messageToAdd: Message = {
      ...rawMessage,
      // Invalid msgDateTime strings (e.g., "not-a-date") become Date objects wrapping NaN,
      // which will be caught by isMessageValid check.
      msgDateTime: new Date(rawMessage.msgDateTime),  
    };

    if (!isMessageValid(messageToAdd)) {
      res.status(400).send('Invalid message');
      return;
    }

    const result = await saveMessage(messageToAdd);
    if ('error' in result) {
      res.status(500).json(result);
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
