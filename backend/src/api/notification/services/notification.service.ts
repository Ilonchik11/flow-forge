import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizationService } from 'src/common/services';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { UpdateNotificationDto } from '../dto';
import { AuthenticatedUser } from 'src/common/interfaces';
import { NotificationType, Prisma } from '@prisma/client';

@Injectable()
export class NotificationService {

  constructor(
    private readonly prismaService: PrismaService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
  }) {
    return this.prismaService.notification.create({
      data,
    });
  }

  async createTx(
    tx: Prisma.TransactionClient,
    data: {
      userId: string;
      type: NotificationType;
      title: string;
      message: string;
    },
  ) {
    return tx.notification.create({
      data,
    });
  }

  async findAll(
    currentUser: AuthenticatedUser,
  ) {
    return this.prismaService.notification.findMany({
      where: {
        userId: currentUser.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(
    id: string,
    currentUser: AuthenticatedUser,
  ) {
    const notification = await this.getNotification(id);

    this.authorizationService.canAccessNotification(
      currentUser,
      notification,
    );

    return notification;
  }

  async update(
    id: string, 
    dto: UpdateNotificationDto,
    currentUser: AuthenticatedUser,
  ) {
    const notification = await this.getNotification(id);

    this.authorizationService.canAccessNotification(
      currentUser,
      notification,
    );

    return this.prismaService.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        isRead: dto.isRead,
        readAt: dto.isRead ? new Date() : null,
      },
    });
  }

  async remove(
    id: string,
    currentUser: AuthenticatedUser,
  ) {
    const notification = await this.getNotification(id);

    this.authorizationService.canAccessNotification(
      currentUser,
      notification,
    );

    await this.prismaService.notification.delete({
      where: {
        id: notification.id,
      },
    });
  }

  async markAllAsRead(
    currentUser: AuthenticatedUser,
  ) {
    const result = await this.prismaService.notification.updateMany({
      where: {
        userId: currentUser.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      updatedCount: result.count,
    };
  }

  async notifyUsers(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
  ) {
    await Promise.all(
      userIds.map((userId) =>
        this.create({
          userId,
          type,
          title,
          message,
        }),
      ),
    );
  }

  async notifyUsersTx(
    tx: Prisma.TransactionClient,
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
  ) {
    await Promise.all(
      userIds.map((userId) =>
        tx.notification.create({
          data: {
            userId,
            type,
            title,
            message,
          },
        }),
      ),
    );
  }

  private async getNotification(notificationId: string) {
    const notification = await this.prismaService.notification.findUnique({
      where: {
        id: notificationId,
      },
    });

    if(!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }
}
