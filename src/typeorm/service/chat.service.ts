import type { Chat } from "../entities/chat.js";
import { chatRepository } from "../repository/chat.repository.js";

export class ChatService {
  async createChat(data: Partial<Chat>): Promise<Chat> {
    const user = chatRepository.create(data);
    return await chatRepository.save(user);
  }

  async findChatById(id: number): Promise<Chat | null> {
    return await chatRepository.findOneBy({ id });
  }

  async findChatsByUserId(userId: string): Promise<Chat[]> {
    return await chatRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }
  async findChatByThreadId(threadId: string): Promise<Chat | null> {
    return await chatRepository.findOneBy({ threadId });
  }
}
