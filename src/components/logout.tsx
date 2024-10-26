"use client";
import { logout } from "@/servers/users";
import { Button } from "./ui/button";

export function LogoutButton() {
	return <Button onClick={async () => logout()}>logout</Button>;
}
