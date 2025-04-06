import chefClaudeIcon from './images/chef-claude-icon.png';
import chefClaudeIcon1 from './images/ai-chef.png';

export default function Header() {
  return (
    <header className="header">
      <img className="logo" src={chefClaudeIcon1} alt="icon" />
      <h1>Fridge Chef</h1>
    </header>
  );
}