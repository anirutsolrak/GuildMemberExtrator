import React from 'react';
import MemberCard from './MemberCard';
import { Box } from '@mui/material';

function MemberList({ members, onMemberSelect }) {
    return (
        <Box data-name="member-list" sx={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', p: '16px'}}>
            {members.map((member, index) => (
                <MemberCard
                    key={index}  // Adicione a propriedade key aqui!
                    member={member}
                    onSelect={() => onMemberSelect(member)}
                />
            ))}
        </Box>
    );
}
export default MemberList;