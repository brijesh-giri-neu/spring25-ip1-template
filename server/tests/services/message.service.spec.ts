import MessageModel from '../../models/messages.model';
import { getMessages, saveMessage } from '../../services/message.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockingoose = require('mockingoose');

const message1 = {
  msg: 'Hello',
  msgFrom: 'User1',
  msgDateTime: new Date('2024-06-04'),
};

const message2 = {
  msg: 'Hi',
  msgFrom: 'User2',
  msgDateTime: new Date('2024-06-05'),
};

describe('Message model', () => {
  beforeEach(() => {
    mockingoose.resetAll();
  });

  describe('saveMessage', () => {
    beforeEach(() => {
      mockingoose.resetAll();
    });

    it('should return the saved message', async () => {
      mockingoose(MessageModel).toReturn(message1, 'create');

      const savedMessage = await saveMessage(message1);

      expect(savedMessage).toMatchObject(message1);
    });

    // TODO: Task 2 - Write a test case for saveMessage when an error occurs
    it('should return error when save fails', async () => {
      // Use Jest spy to simulate error
      const createSpy = jest
        .spyOn(MessageModel, 'create')
        .mockRejectedValueOnce(new Error('Database error'));

      const result = await saveMessage(message1);

      expect(result).toEqual({ error: 'Error when saving a message' });
      createSpy.mockRestore();
    });
  });

  describe('getMessages', () => {
    it('should return all messages, sorted by date', async () => {
      mockingoose(MessageModel).toReturn([message1, message2], 'find');

      const messages = await getMessages();

      expect(messages).toMatchObject([message1, message2]);
    });

    // TODO: Task 2 - Write a test case for getMessages when an error occurs
    it('should return empty array when getMessages fails', async () => {
      // Use Jest spy to simulate error
      const findSpy = jest
        .spyOn(MessageModel, 'find')
        .mockRejectedValueOnce(new Error('Database error'));

      const messages = await getMessages();

      expect(messages).toEqual([]);
      findSpy.mockRestore();
    });
  });
});
