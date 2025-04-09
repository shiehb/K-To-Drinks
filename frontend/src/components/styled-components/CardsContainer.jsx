import React from 'react';
import styled from 'styled-components';
import Card from './Card'; // Import the Card component

const CardsContainer = ({ data, onViewDetails }) => {
  return (
    <StyledContainer>
      {data.map((item) => (
        <Card
        key={item.id}
        title={item.title}
        value={item.value}
        description={item.description}
        onViewDetails={() => onViewDetails(item)}
        icon={item.icon}
        currentSales={item.currentSales}
        previousSales={item.previousSales}
        text={item.text}
      />
      
      ))}
    </StyledContainer>
  );
};

const StyledContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
`;

export default CardsContainer;