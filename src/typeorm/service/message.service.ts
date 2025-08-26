import type { Message } from "../entities/message.js";
import { messageRepository } from "../repository/message.repository.js";

export class MessageService {
  async createMessage(data: Partial<Message>): Promise<Message> {
    const user = messageRepository.create(data);
    return await messageRepository.save(user);
  }

  async findMessagesByChatId(chatId: string): Promise<Message[]> {
    return await messageRepository.find({
      where: { chatId },
      order: { createdAt: "ASC" },
    });
  }

  async deleteMessagesByChatId(chatId: string): Promise<void> {
    await messageRepository.delete({ chatId });
  }

  async countMessagesByChatId(chatId: string): Promise<number> {
    return await messageRepository.count({ where: { chatId } });
  }
}
