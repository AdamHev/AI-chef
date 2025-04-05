import chefClaudeIcon from './images/chef-claude-icon.png';
import chefClaudeIcon from './images/ai-chef.png';

export default function Header() {
  return (
    <header className="header">
      <img className="logo" src={chefClaudeIcon} alt="icon" />
      <h1>Chef Claude</h1>
    </header>
  );
}