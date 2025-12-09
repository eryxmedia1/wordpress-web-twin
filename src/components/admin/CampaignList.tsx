import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import { Pencil, Trash2, Play, Pause, Archive, Plus } from "lucide-react";

export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  priority: number;
  start_at: string | null;
  end_at: string | null;
  max_impressions: number | null;
  current_impressions: number;
  allowed_positions: string[];
  allowed_membership_tiers: string[];
  created_at: string;
}

interface CampaignListProps {
  campaigns: Campaign[];
  onEdit: (campaign: Campaign) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, newStatus: string) => void;
  onCreateNew: () => void;
}

export function CampaignList({ 
  campaigns, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onCreateNew 
}: CampaignListProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Paused</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Completed</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">Draft</Badge>;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return format(new Date(date), 'MMM d, yyyy');
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Ad Campaigns</CardTitle>
        <Button onClick={onCreateNew} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </CardHeader>
      <CardContent>
        {campaigns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No campaigns yet. Create your first campaign to get started.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Impressions</TableHead>
                <TableHead>Positions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{campaign.priority}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(campaign.start_at)} — {formatDate(campaign.end_at)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {campaign.current_impressions.toLocaleString()}
                      {campaign.max_impressions && (
                        <span className="text-muted-foreground">
                          {' / '}{campaign.max_impressions.toLocaleString()}
                        </span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {campaign.allowed_positions?.slice(0, 2).map((pos) => (
                        <Badge key={pos} variant="secondary" className="text-xs">
                          {pos.replace('_', '-')}
                        </Badge>
                      ))}
                      {campaign.allowed_positions?.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{campaign.allowed_positions.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {campaign.status === 'active' ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onToggleStatus(campaign.id, 'paused')}
                          title="Pause Campaign"
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                      ) : campaign.status === 'paused' || campaign.status === 'draft' ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onToggleStatus(campaign.id, 'active')}
                          title="Activate Campaign"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(campaign)}
                        title="Edit Campaign"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {campaign.status !== 'completed' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onToggleStatus(campaign.id, 'completed')}
                          title="Archive Campaign"
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(campaign.id)}
                        className="text-destructive hover:text-destructive"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
