export class CreateSponsorDto {
    manager: string;
    link: string
    is_bot: boolean;
    token?: string;
    chat_id?: number;
    title?: string;
    name?: string;
    chat_name?: string;
}