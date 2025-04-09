import React from 'react';
import styled from 'styled-components';

const Card = ({ title, value, description, onViewDetails, icon, currentSales, previousSales, text }) => {
  // Calculate the percentage change in sales
  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return 0; // Avoid division by zero
    return ((current - previous) / previous) * 100;
  };

  // Ensure currentSales and previousSales are numbers
  const current = parseFloat(currentSales);
  const previous = parseFloat(previousSales);

  // Calculate the percentage change
  const percentageChange = calculatePercentageChange(current, previous);

  // Cap the width at 100% to avoid exceeding the container
  const fillWidth = Math.min(Math.abs(percentageChange), 100);

  // Determine fill color
  const fillColor = percentageChange <= -1 ? '#ff4d4d' : percentageChange >= 0 ? '#02972f' : '#E5E7EB';

  return (
    <StyledCard onClick={onViewDetails}>
      <div className="title">
        <p className="title-text">{title}</p>
        <span>
          <img src={icon} alt={title} width={30} height={30} /> {/* Updated icon size */}
        </span>
      </div>
      <div className="data">
        <p>
          {value} {text}
        </p>
        <div className="range">
          <div className="fill" style={{ width: `${fillWidth}%`, backgroundColor: fillColor }}></div>
        </div>
      </div>
      <p className="percent" style={{ color: percentageChange < 0 ? '#ff4d4d' : '#02972f' }}>
        <svg viewBox="0 0 1792 1792" fill="currentColor" height={20} width={20}>
          <path d="M1408 1216q0 26-19 45t-45 19h-896q-26 0-45-19t-19-45 19-45l448-448q19-19 45-19t45 19l448 448q19 19 19 45z" />
        </svg>
        {!isNaN(percentageChange) ? `${percentageChange.toFixed(1)}%  ` : '0 '}{}
        <span style={{ color: 'black' }}>vs past month</span>
      </p>
    </StyledCard>
  );
};

const StyledCard = styled.div`
  padding: 1rem;
  background-color: #fff;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-radius: 20px;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 20px -5px rgba(0, 0, 0, 0.1);
  }

  .title {
    display: flex;
    align-items: center;
    font-weight: bold;
    background-color: var(--sbackground-color);
    height: 50px;
  }

  .title span {
    position: relative;
    padding: 0.5rem;
    width: 2.5rem; /* Updated container size */
    height: 2.5rem; /* Updated container size */
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 0.5rem; /* Push the icon container to the right */
    margin-left: auto; /* Push the icon container to the right */
  }

  .title span img {
    width: 30px; /* Updated icon size */
    height: 30px; /* Updated icon size */
    color: #ffffff;
  }

  .title-text {
    margin-left: 0.5rem;
    color: #374151;
    font-size: 18px;
  }

  .percent {
    margin-left: 0.5rem;
    font-weight: 600;
    display: flex;
    align-items: center;
  }

  .data {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  .data p {
    margin-top: 1rem;
    margin-bottom: 1rem;
    color: #1F2937;
    font-size: 2.25rem;
    line-height: 2.5rem;
    font-weight: 700;
    text-align: left;
  }

  .data .range {
    position: relative;
    background-color: #E5E7EB;
    width: 100%;
    height: 0.5rem;
    border-radius: 0.25rem;
  }

  .data .range .fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    border-radius: 0.25rem;
    transition: width 0.3s ease;
  }
`;

export default Card;