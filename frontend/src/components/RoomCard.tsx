import { Users, Video, ArrowRight } from "lucide-react";
import { FaArrowRightLong } from "react-icons/fa6";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface RoomCardProps {
  roomName: string;
  activeUsers: {
    id: string;
    username: string;
  }[];
  onJoin: () => void;
}

const RoomCard = ({ roomName, activeUsers, onJoin }: RoomCardProps) => {
  return (
    <Card className="group hover:shadow-lg transition-all bg-gradient-card border-border/50 animate-fade-in hover:border-primary/30 cursor-pointer duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-14 h-14 bg-gradient-primary/10 rounded-xl flex items-center justify-center group-hover:bg-gradient-primary/20 transition-colors shadow-soft">
              <Video className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-bold truncate mb-1">
                {roomName}
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5 text-sm">
                <Users className="w-4 h-4" />
                <span>
                  {activeUsers.length}{" "}
                  {activeUsers.length === 1 ? "participant" : "participants"}
                </span>
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 shrink-0"
          >
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 min-h-[2.5rem]">
          <div className="flex -space-x-2 flex-1">
            {activeUsers.slice(0, 4).map((user, index) => (
              <Avatar
                key={index}
                className="w-8 h-8 border-2 border-background"
              >
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {activeUsers.length > 4 && (
              <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                <span className="text-xs font-semibold text-muted-foreground">
                  +{activeUsers.length - 4}
                </span>
              </div>
            )}
          </div>
        </div>
        <Button
          onClick={onJoin}
          className="w-full py-2 flex flex-row items-center gap-5 bg-gradient-primary transition-all shadow-medium hover:shadow-lg hover:scale-[1.02] group/btn duration-200"
        >
          <p className="text-sm md:text-base font-semibold">Join Room</p>
          <FaArrowRightLong strokeWidth={1} className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default RoomCard;
